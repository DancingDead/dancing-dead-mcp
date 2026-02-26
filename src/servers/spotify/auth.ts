import type { Application } from "express";
import fetch from "node-fetch";
import { logger } from "../../config.js";
import { getAccount, setAccount } from "./store.js";

// ── Constantes ───────────────────────────────────────

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

export const SPOTIFY_SCOPES = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "ugc-image-upload",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-recently-played",
    "user-library-read",
    "user-library-modify",
    "user-read-private",
    "user-read-email",
    "user-top-read",
].join(" ");

// ── Config ───────────────────────────────────────────

export function getSpotifyConfig() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/spotify/callback";

    if (!clientId || !clientSecret) {
        throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env");
    }

    return { clientId, clientSecret, redirectUri };
}

// ── Générer l'URL d'autorisation ─────────────────────

export function generateAuthUrl(accountName: string): string {
    const { clientId, redirectUri } = getSpotifyConfig();

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        scope: SPOTIFY_SCOPES,
        state: accountName,
        show_dialog: "true",
    });

    return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

// ── Échanger le code contre des tokens ───────────────

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    const { clientId, clientSecret, redirectUri } = getSpotifyConfig();

    const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[auth] Token exchange failed (${response.status}): ${errorText}`);

        // Try to parse as JSON error, fallback to text
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(`Spotify token exchange failed: ${errorJson.error} - ${errorJson.error_description || ''}`);
        } catch {
            throw new Error(`Spotify token exchange failed (${response.status}): ${errorText.substring(0, 200)}`);
        }
    }

    const data = await response.json();
    return data as TokenResponse;
}

// ── Rafraîchir un token expiré ───────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const { clientId, clientSecret } = getSpotifyConfig();

    const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
    }

    return response.json() as Promise<TokenResponse>;
}

// ── S'assurer qu'un token est valide ─────────────────

// Lock pour éviter les refreshs concurrents
const refreshLocks = new Map<string, Promise<string>>();

export async function ensureValidToken(accountName: string): Promise<string> {
    const account = await getAccount(accountName);
    if (!account) {
        throw new Error(`Account "${accountName}" not found`);
    }

    // Si le token est encore valide (avec 1 minute de marge)
    if (Date.now() < account.expiresAt - 60_000) {
        return account.accessToken;
    }

    // Vérifier si un refresh est déjà en cours pour ce compte
    const existingLock = refreshLocks.get(accountName);
    if (existingLock) {
        return existingLock;
    }

    // Lancer le refresh
    const refreshPromise = (async () => {
        try {
            logger.info(`Refreshing token for account "${accountName}"`);
            const tokens = await refreshAccessToken(account.refreshToken);

            await setAccount(accountName, {
                ...account,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || account.refreshToken,
                expiresAt: Date.now() + tokens.expires_in * 1000,
            });

            return tokens.access_token;
        } finally {
            refreshLocks.delete(accountName);
        }
    })();

    refreshLocks.set(accountName, refreshPromise);
    return refreshPromise;
}

// ── Route callback OAuth ─────────────────────────────

export function mountAuthRoutes(app: Application): void {
    app.get("/spotify/callback", async (req, res) => {
        const code = req.query.code as string | undefined;
        const state = req.query.state as string | undefined;
        const error = req.query.error as string | undefined;

        if (error) {
            res.status(400).send(`
        <h1>Authorization failed</h1>
        <p>Error: ${error}</p>
        <p>You can close this tab.</p>
      `);
            return;
        }

        if (!code || !state) {
            res.status(400).send(`
        <h1>Missing parameters</h1>
        <p>Code or state parameter missing.</p>
      `);
            return;
        }

        try {
            // Échanger le code contre des tokens
            const tokens = await exchangeCodeForTokens(code);

            // Récupérer le profil Spotify de l'utilisateur
            const profileRes = await fetch("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            const profile = (await profileRes.json()) as {
                display_name: string;
                id: string;
            };

            // Sauvegarder dans le store
            await setAccount(state, {
                displayName: profile.display_name || profile.id,
                spotifyUserId: profile.id,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: Date.now() + tokens.expires_in * 1000,
                scopes: tokens.scope,
                addedAt: new Date().toISOString(),
            });

            logger.info(`Spotify account "${state}" connected as ${profile.display_name}`);

            res.send(`
        <h1>Account connected!</h1>
        <p>Account "<strong>${state}</strong>" connected as 
           <strong>${profile.display_name}</strong>.</p>
        <p>You can close this tab.</p>
      `);
        } catch (err) {
            logger.error("OAuth callback error:", err);
            res.status(500).send(`
        <h1>Error</h1>
        <p>${err instanceof Error ? err.message : "Unknown error"}</p>
      `);
        }
    });
}
