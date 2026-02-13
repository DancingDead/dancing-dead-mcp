#!/usr/bin/env tsx
/**
 * Direct API Test
 * Tests Spotify API directly, bypassing the MCP server
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const STORE_PATH = join(process.cwd(), "data", "spotify-accounts.json");

console.log("🧪 Direct Spotify API Test");
console.log("===========================\n");

// Load token
const storeContent = await readFile(STORE_PATH, "utf-8");
const store = JSON.parse(storeContent);
const account = store["dancing-dead"];

console.log("📋 Using Token:");
console.log(`   Account: ${account.displayName}`);
console.log(`   Expires: ${new Date(account.expiresAt).toISOString()}`);
console.log(`   Token: ${account.accessToken.substring(0, 20)}...`);
console.log();

// Get user ID
console.log("1️⃣ Getting User ID...");
const meRes = await fetch("https://api.spotify.com/v1/me", {
  headers: { "Authorization": `Bearer ${account.accessToken}` },
});
const me = await meRes.json();
console.log(`   User ID: ${me.id}`);
console.log();

// Try to create a playlist DIRECTLY (bypassing MCP)
console.log("2️⃣ Creating Playlist (DIRECT API CALL)...");
const createRes = await fetch(`https://api.spotify.com/v1/users/${me.id}/playlists`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${account.accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: `Direct API Test ${Date.now()}`,
    description: "Testing if direct API calls work",
    public: false,
  }),
});

console.log(`   Response: ${createRes.status} ${createRes.statusText}`);

if (createRes.ok) {
  const playlist = await createRes.json();
  console.log("\n✅ SUCCESS! Playlist created!");
  console.log(`   Name: ${playlist.name}`);
  console.log(`   ID: ${playlist.id}`);
  console.log(`   URL: ${playlist.external_urls.spotify}`);
  console.log();
  console.log("🎯 CONCLUSION:");
  console.log("   The token WORKS for write operations!");
  console.log("   The problem is with the MCP server, not Spotify.");
  console.log();
  console.log("💡 SOLUTION:");
  console.log("   Restart Claude Desktop to reload the MCP server");
  console.log("   The server might be caching an old token");
} else {
  const errorBody = await createRes.text();
  console.log(`\n❌ FAILED with ${createRes.status}`);
  console.log(`   Body: ${errorBody}`);

  try {
    const errorJson = JSON.parse(errorBody);
    console.log(`\n📋 Error Details:`);
    console.log(`   Error: ${errorJson.error?.status}`);
    console.log(`   Message: ${errorJson.error?.message}`);
    console.log(`   Reason: ${errorJson.error?.reason || 'N/A'}`);
  } catch {}

  console.log();
  console.log("🎯 CONCLUSION:");
  console.log("   The token itself is REJECTED by Spotify");
  console.log("   This is a Spotify Application issue, not MCP");
  console.log();

  if (createRes.status === 403) {
    console.log("💡 SOLUTIONS:");
    console.log();
    console.log("1. Your Spotify application is in Development Mode with restrictions");
    console.log("   → Go to: https://developer.spotify.com/dashboard");
    console.log("   → Select your app");
    console.log("   → Request 'Extended Quota Mode'");
    console.log();
    console.log("2. Regional restrictions (account is in FR)");
    console.log("   → Some countries have temporary API limitations");
    console.log();
    console.log("3. Create a NEW Spotify application");
    console.log("   → See: CREATE_NEW_SPOTIFY_APP.md");
    console.log("   → This usually fixes the issue immediately");
    console.log();
    console.log("4. Wait 24-48 hours");
    console.log("   → New apps/accounts sometimes have temporary restrictions");
  }
}

console.log();

// Try to add tracks to existing playlist
console.log("3️⃣ Testing: Add Tracks to Existing Playlist...");
const playlistsRes = await fetch("https://api.spotify.com/v1/me/playlists?limit=1", {
  headers: { "Authorization": `Bearer ${account.accessToken}` },
});

if (playlistsRes.ok) {
  const playlists = await playlistsRes.json();
  if (playlists.items && playlists.items.length > 0) {
    const playlist = playlists.items[0];
    console.log(`   Target Playlist: ${playlist.name}`);

    // Try to add a track
    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: ["spotify:track:1h54366McXSNcici2LAiZP"], // Naeleck - Smells Like Teen Spirit
      }),
    });

    console.log(`   Response: ${addRes.status} ${addRes.statusText}`);

    if (addRes.ok) {
      console.log("   ✅ Successfully added track!");
      console.log("   → The token CAN modify playlists");
    } else {
      const error = await addRes.text();
      console.log(`   ❌ Failed to add track`);
      console.log(`   Error: ${error.substring(0, 200)}`);
    }
  }
}

console.log();
console.log("═".repeat(60));
