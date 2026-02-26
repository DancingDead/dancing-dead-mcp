import type { Application } from "express";
import { calendar } from "@googleapis/calendar";
import { OAuth2Client } from "google-auth-library";
import { logger } from "../../config.js";
import { getAccount, setAccount } from "./store.js";

// ── Constants ───────────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const GOOGLE_WORKSPACE_SCOPES = [
    // Calendar
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    // Tasks
    "https://www.googleapis.com/auth/tasks",
    // Drive
    "https://www.googleapis.com/auth/drive",
    // Sheets
    "https://www.googleapis.com/auth/spreadsheets",
    // Docs
    "https://www.googleapis.com/auth/documents.readonly",
    // Gmail
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
    // Slides
    "https://www.googleapis.com/auth/presentations.readonly",
    // User info
    "https://www.googleapis.com/auth/userinfo.email",
];

// ── Config ───────────────────────────────────────────

export function getGoogleWorkspaceConfig() {
    const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_WORKSPACE_REDIRECT_URI || "http://127.0.0.1:3000/google-workspace/callback";

    if (!clientId || !clientSecret) {
        throw new Error("GOOGLE_WORKSPACE_CLIENT_ID and GOOGLE_WORKSPACE_CLIENT_SECRET must be set in .env");
    }

    return { clientId, clientSecret, redirectUri };
}

// ── Generate authorization URL ─────────────────────

export function generateAuthUrl(accountName: string): string {
    const { clientId, redirectUri } = getGoogleWorkspaceConfig();

    const oauth2Client = new OAuth2Client(clientId, "", redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: GOOGLE_WORKSPACE_SCOPES,
        state: accountName,
        prompt: "consent", // Force to get refresh token
    });

    return authUrl;
}

// ── Exchange code for tokens ───────────────────────

interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    const { clientId, clientSecret, redirectUri } = getGoogleWorkspaceConfig();

    const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        redirectUri
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token) {
            throw new Error("No access token received from Google");
        }

        if (!tokens.refresh_token) {
            throw new Error("No refresh token received. User may have already authorized this app. Revoke access and try again.");
        }

        return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
            token_type: tokens.token_type || "Bearer",
            scope: tokens.scope || GOOGLE_WORKSPACE_SCOPES.join(" "),
        };
    } catch (error) {
        logger.error("[google-workspace] Token exchange failed:", error);
        throw new Error(`Google token exchange failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// ── Refresh expired token ───────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const { clientId, clientSecret, redirectUri } = getGoogleWorkspaceConfig();

    const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        redirectUri
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        if (!credentials.access_token) {
            throw new Error("No access token received from Google");
        }

        return {
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token || refreshToken,
            expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600,
            token_type: credentials.token_type || "Bearer",
            scope: credentials.scope || GOOGLE_WORKSPACE_SCOPES.join(" "),
        };
    } catch (error) {
        logger.error("[google-workspace] Token refresh failed:", error);
        throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// ── Ensure valid token ─────────────────────────────

// Lock to prevent concurrent refreshes
const refreshLocks = new Map<string, Promise<string>>();

export async function ensureValidToken(accountName: string): Promise<string> {
    const account = await getAccount(accountName);
    if (!account) {
        throw new Error(`Account "${accountName}" not found`);
    }

    // If token is still valid (with 1 minute margin)
    if (Date.now() < account.expiresAt - 60_000) {
        return account.accessToken;
    }

    // Check if a refresh is already in progress for this account
    const existingLock = refreshLocks.get(accountName);
    if (existingLock) {
        return existingLock;
    }

    // Start the refresh
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

// ── OAuth callback route ─────────────────────────────

export function mountAuthRoutes(app: Application): void {
    app.get("/google-workspace/callback", async (req, res) => {
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
            // Exchange code for tokens
            const tokens = await exchangeCodeForTokens(code);

            // Get user email from Google using token info
            const { clientId, clientSecret, redirectUri } = getGoogleWorkspaceConfig();
            const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
            oauth2Client.setCredentials({
                access_token: tokens.access_token,
            });

            // Fetch user info using the userinfo endpoint
            const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.statusText}`);
            }

            const userInfo = await response.json() as { email?: string; name?: string };
            const email = userInfo.email || "unknown";
            const displayName = userInfo.name || email;

            // Save to store
            await setAccount(state, {
                displayName,
                email,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || "",
                expiresAt: Date.now() + tokens.expires_in * 1000,
                scopes: tokens.scope,
                addedAt: new Date().toISOString(),
            });

            logger.info(`Google Workspace account "${state}" connected as ${email}`);

            res.send(`
                <h1>Account connected!</h1>
                <p>Account "<strong>${state}</strong>" connected as
                   <strong>${displayName}</strong> (${email}).</p>
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