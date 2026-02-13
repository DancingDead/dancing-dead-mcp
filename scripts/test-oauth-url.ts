#!/usr/bin/env tsx
/**
 * Test OAuth URL generation
 * This helps debug "INVALID_CLIENT" errors by showing the exact URL
 */

import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env
config({ path: resolve(process.cwd(), ".env") });

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";

const SPOTIFY_SCOPES = [
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

console.log("🔍 OAuth Configuration Test");
console.log("===========================\n");

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/spotify/callback";

console.log("📋 Environment Variables:");
console.log(`   SPOTIFY_CLIENT_ID: ${clientId ? clientId.substring(0, 10) + "..." : "❌ NOT SET"}`);
console.log(`   SPOTIFY_CLIENT_SECRET: ${clientSecret ? clientSecret.substring(0, 10) + "..." : "❌ NOT SET"}`);
console.log(`   SPOTIFY_REDIRECT_URI: ${redirectUri}\n`);

if (!clientId || !clientSecret) {
    console.error("❌ Missing credentials in .env file");
    process.exit(1);
}

// Generate OAuth URL
const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    state: "test-account",
    show_dialog: "true",
});

const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;

console.log("🔗 Generated OAuth URL:");
console.log(`   ${authUrl}\n`);

console.log("📝 Decoded Parameters:");
console.log(`   client_id: ${clientId}`);
console.log(`   redirect_uri: ${redirectUri}`);
console.log(`   response_type: code`);
console.log(`   state: test-account\n`);

console.log("✅ Next Steps:");
console.log("1. Verify the redirect_uri EXACTLY matches what's in your Spotify Dashboard");
console.log("2. Go to: https://developer.spotify.com/dashboard");
console.log("3. Check your app's settings");
console.log("4. Ensure this redirect URI is added:");
console.log(`   ${redirectUri}`);
console.log("\n⚠️  Common issues:");
console.log("   - URI has trailing slash (remove it)");
console.log("   - Using 'localhost' instead of '127.0.0.1' (use 127.0.0.1)");
console.log("   - URI missing '/spotify/callback' path");
console.log("   - Wrong Client ID (verify it matches your dashboard)");
