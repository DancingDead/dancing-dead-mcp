#!/usr/bin/env tsx
/**
 * Verify Spotify Credentials
 * Tests if Client ID and Secret are valid by making a test request
 */

import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env
config({ path: resolve(process.cwd(), ".env") });

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/spotify/callback";

console.log("🔐 Spotify Credentials Verification");
console.log("====================================\n");

if (!clientId || !clientSecret) {
  console.error("❌ Missing credentials in .env file");
  console.error("   SPOTIFY_CLIENT_ID:", clientId ? "✓" : "✗");
  console.error("   SPOTIFY_CLIENT_SECRET:", clientSecret ? "✓" : "✗");
  process.exit(1);
}

console.log("📋 Configuration:");
console.log(`   Client ID: ${clientId}`);
console.log(`   Secret: ${clientSecret.substring(0, 10)}...`);
console.log(`   Redirect URI: ${redirectUri}\n`);

// Test: Request access token using client credentials flow
// This doesn't give user access, but validates the credentials
console.log("🧪 Testing credentials with Spotify API...\n");

const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const response = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Authorization": `Basic ${authString}`,
  },
  body: new URLSearchParams({
    grant_type: "client_credentials",
  }),
});

console.log(`Response status: ${response.status} ${response.statusText}`);

if (response.ok) {
  const data = await response.json();
  console.log("\n✅ SUCCESS! Credentials are valid!");
  console.log(`   Token type: ${data.token_type}`);
  console.log(`   Expires in: ${data.expires_in} seconds`);
  console.log("\n🎯 Next Steps:");
  console.log("   1. Verify redirect URI in Spotify Dashboard:");
  console.log(`      ${redirectUri}`);
  console.log("   2. Restart Claude Desktop");
  console.log("   3. Try authentication again");
} else {
  const errorText = await response.text();
  console.log("\n❌ FAILED! Credentials are invalid\n");

  try {
    const errorJson = JSON.parse(errorText);
    console.log(`Error: ${errorJson.error}`);
    console.log(`Description: ${errorJson.error_description || 'N/A'}`);
  } catch {
    console.log(`Error response: ${errorText.substring(0, 500)}`);
  }

  console.log("\n🔍 Troubleshooting:");
  console.log("   1. Go to: https://developer.spotify.com/dashboard");
  console.log("   2. Select your application");
  console.log("   3. Verify the Client ID matches:");
  console.log(`      ${clientId}`);
  console.log("   4. Click 'Show Client Secret' and verify it matches:");
  console.log(`      ${clientSecret}`);
  console.log("   5. If different, update your .env file");

  process.exit(1);
}
