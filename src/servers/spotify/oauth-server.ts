/**
 * Temporary OAuth server for stdio mode
 *
 * This mini HTTP server runs ONLY during OAuth authentication
 * to handle the Spotify callback, then shuts down automatically.
 */

import express from "express";
import fetch from "node-fetch";
import { Server } from "node:http";
import { exchangeCodeForTokens, getSpotifyConfig } from "./auth.js";
import { setAccount } from "./store.js";

interface OAuthResult {
  success: boolean;
  accountName?: string;
  displayName?: string;
  error?: string;
}

let serverInstance: Server | null = null;

export async function startTemporaryOAuthServer(): Promise<{ port: number; url: string }> {
  const config = getSpotifyConfig();

  // Extract port from redirect URI
  const url = new URL(config.redirectUri);
  const port = parseInt(url.port) || 3000;

  // Check if server is already running
  if (serverInstance) {
    return { port, url: config.redirectUri };
  }

  const app = express();

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", message: "Temporary OAuth server running" });
  });

  // OAuth callback
  app.get("/spotify/callback", async (req, res) => {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const error = req.query.error as string | undefined;

    if (error) {
      res.status(400).send(`
        <h1>❌ Authorization failed</h1>
        <p>Error: ${error}</p>
        <p>You can close this tab and try again.</p>
      `);
      return;
    }

    if (!code || !state) {
      res.status(400).send(`
        <h1>❌ Missing parameters</h1>
        <p>Code or state parameter missing.</p>
      `);
      return;
    }

    try {
      console.error(`[oauth-server] Exchanging code for tokens...`);

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code);
      console.error(`[oauth-server] Tokens received successfully`);

      // Get Spotify profile
      console.error(`[oauth-server] Fetching Spotify profile...`);
      const profileRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!profileRes.ok) {
        const errorText = await profileRes.text();
        console.error(`[oauth-server] Profile fetch failed: ${errorText}`);
        throw new Error(`Failed to fetch Spotify profile: ${profileRes.status} ${errorText.substring(0, 200)}`);
      }

      const profile = (await profileRes.json()) as {
        display_name: string;
        id: string;
      };
      console.error(`[oauth-server] Profile fetched: ${profile.display_name || profile.id}`);

      // Save to store
      console.error(`[oauth-server] Saving account "${state}" to store...`);
      await setAccount(state, {
        displayName: profile.display_name || profile.id,
        spotifyUserId: profile.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scopes: tokens.scope,
        addedAt: new Date().toISOString(),
      });
      console.error(`[oauth-server] Account "${state}" saved successfully`);

      res.send(`
        <h1>✅ Account connected!</h1>
        <p>Account "<strong>${state}</strong>" connected as
           <strong>${profile.display_name}</strong>.</p>
        <p><strong>You can close this tab now.</strong></p>
        <p>The temporary OAuth server will shut down in 5 seconds.</p>
      `);

      // Auto-shutdown after successful auth
      setTimeout(() => {
        stopTemporaryOAuthServer();
      }, 5000);

    } catch (err) {
      console.error("[oauth-server] Callback error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : '';

      console.error("[oauth-server] Error details:", {
        message: errorMessage,
        stack: errorStack,
        code,
        state
      });

      res.status(500).send(`
        <h1>❌ Authentication Error</h1>
        <p><strong>Error:</strong> ${errorMessage}</p>
        <hr>
        <h3>🔍 Possible Causes:</h3>
        <ul>
          <li>Invalid Client ID or Client Secret in .env file</li>
          <li>Redirect URI mismatch between .env and Spotify Dashboard</li>
          <li>Authorization code expired (try again)</li>
        </ul>
        <h3>✅ What to Check:</h3>
        <ol>
          <li>Verify SPOTIFY_CLIENT_ID matches your Spotify Dashboard</li>
          <li>Verify SPOTIFY_CLIENT_SECRET is correct</li>
          <li>Verify redirect URI in Dashboard is: <code>http://127.0.0.1:3000/spotify/callback</code></li>
        </ol>
        <p><strong>You can close this tab and check your configuration.</strong></p>
        <p>Run: <code>./scripts/spotify-diagnostic.sh</code></p>
      `);
    }
  });

  // Start server
  return new Promise((resolve, reject) => {
    try {
      // Listen on 0.0.0.0 to accept both localhost and 127.0.0.1
      serverInstance = app.listen(port, "0.0.0.0", () => {
        console.error(`[oauth-server] Temporary OAuth server started on http://localhost:${port}`);
        resolve({ port, url: config.redirectUri });
      });

      serverInstance.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          // Port already in use - assume main server is running
          console.error(`[oauth-server] Port ${port} already in use (main server running?)`);
          serverInstance = null;
          resolve({ port, url: config.redirectUri });
        } else {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function stopTemporaryOAuthServer(): void {
  if (serverInstance) {
    console.error("[oauth-server] Shutting down temporary OAuth server...");
    serverInstance.close();
    serverInstance = null;
  }
}

export function isOAuthServerRunning(): boolean {
  return serverInstance !== null;
}
