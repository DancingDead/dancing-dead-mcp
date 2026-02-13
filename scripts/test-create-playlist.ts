#!/usr/bin/env tsx
/**
 * Test Create Playlist
 * Tests if the account can create playlists
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const STORE_PATH = join(process.cwd(), "data", "spotify-accounts.json");

console.log("🧪 Testing Playlist Creation");
console.log("============================\n");

// Load account
const storeContent = await readFile(STORE_PATH, "utf-8");
const store = JSON.parse(storeContent);
const account = store["dancing-dead"];

if (!account) {
  console.error("❌ Account not found");
  process.exit(1);
}

console.log("📋 Account Info:");
console.log(`   Display Name: ${account.displayName}`);
console.log(`   User ID: ${account.spotifyUserId}`);
console.log();

// Get user profile to get the user_id
console.log("1️⃣ Getting user profile...");
const profileRes = await fetch("https://api.spotify.com/v1/me", {
  headers: {
    "Authorization": `Bearer ${account.accessToken}`,
  },
});

if (!profileRes.ok) {
  console.error(`❌ Failed to get profile: ${profileRes.status} ${profileRes.statusText}`);
  process.exit(1);
}

const profile = await profileRes.json();
console.log(`   ✅ User ID: ${profile.id}`);
console.log(`   Product: ${profile.product}`);
console.log();

// Try to create a playlist
console.log("2️⃣ Attempting to create a test playlist...");
const createRes = await fetch(`https://api.spotify.com/v1/users/${profile.id}/playlists`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${account.accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Test MCP Playlist (Delete Me)",
    description: "Test playlist created by MCP server - feel free to delete",
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
  console.log("\n💡 Your account CAN create playlists!");
  console.log("   The error might have been temporary or with the MCP tool.");
} else {
  const errorBody = await createRes.text();
  console.log(`\n❌ FAILED to create playlist`);
  console.log(`   Status: ${createRes.status}`);
  console.log(`   Status Text: ${createRes.statusText}`);
  console.log(`   Body: ${errorBody}`);

  try {
    const errorJson = JSON.parse(errorBody);
    console.log(`\n📋 Error Details:`);
    console.log(`   Error: ${errorJson.error?.status || 'N/A'}`);
    console.log(`   Message: ${errorJson.error?.message || 'N/A'}`);
    console.log(`   Reason: ${errorJson.error?.reason || 'N/A'}`);
  } catch {
    // Not JSON
  }

  console.log(`\n🔍 Possible Causes:`);

  if (createRes.status === 403) {
    console.log(`   1. Your Spotify account is FREE`);
    console.log(`      → Spotify API doesn't allow playlist creation for FREE accounts`);
    console.log(`      → Solution: Upgrade to Spotify Premium`);
    console.log();
    console.log(`   2. Your account is in a restricted region`);
    console.log(`      → Some regions have limited API access`);
    console.log();
    console.log(`   3. Missing or invalid OAuth scopes`);
    console.log(`      → But we verified the scopes are present...`);
    console.log();
    console.log(`   4. Account is not fully verified`);
    console.log(`      → Check your email for Spotify verification`);
  }

  console.log(`\n📊 Scopes Present:`);
  const scopes = account.scopes.split(' ');
  console.log(`   Total: ${scopes.length} scopes`);
  const playlistScopes = scopes.filter((s: string) => s.includes('playlist'));
  playlistScopes.forEach((scope: string) => {
    console.log(`   ✅ ${scope}`);
  });
}

console.log();
console.log("═".repeat(60));
console.log();

if (profile.product === "free") {
  console.log("⚠️  IMPORTANT: Your account is Spotify FREE");
  console.log();
  console.log("Spotify's Web API has limitations for FREE accounts:");
  console.log("- ❌ Cannot create/modify playlists via API");
  console.log("- ❌ Cannot control playback via API");
  console.log("- ✅ CAN search and read metadata");
  console.log("- ✅ CAN read playlists");
  console.log();
  console.log("💡 To use playlist creation features:");
  console.log("   1. Upgrade to Spotify Premium (~10€/month)");
  console.log("   2. Or create playlists manually in the Spotify app");
  console.log();
  console.log("📖 See: SPOTIFY_FREE_LIMITATIONS.md");
}
