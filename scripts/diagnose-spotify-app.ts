#!/usr/bin/env tsx
/**
 * Diagnose Spotify Application
 * Checks the status and permissions of the Spotify application
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

const clientId = process.env.SPOTIFY_CLIENT_ID!;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

console.log("🔍 Spotify Application Diagnostics");
console.log("====================================\n");

console.log("📋 Configuration:");
console.log(`   Client ID: ${clientId}`);
console.log(`   Secret: ${clientSecret.substring(0, 10)}...`);
console.log();

// Test 1: Verify credentials work
console.log("1️⃣ Testing Credentials (Client Credentials Flow)...");
const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Authorization": `Basic ${authString}`,
  },
  body: new URLSearchParams({
    grant_type: "client_credentials",
  }),
});

if (tokenRes.ok) {
  console.log("   ✅ Credentials are valid");
  console.log("   ✅ Application is active");
} else {
  const error = await tokenRes.text();
  console.log("   ❌ Credentials failed");
  console.log(`   Error: ${error}`);
  process.exit(1);
}
console.log();

// Test 2: Check with the user's actual token
console.log("2️⃣ Loading User Account Token...");
const { readFile } = await import("node:fs/promises");
const { join } = await import("node:path");
const storeContent = await readFile(join(process.cwd(), "data", "spotify-accounts.json"), "utf-8");
const store = JSON.parse(storeContent);
const account = store["dancing-dead"];

if (!account) {
  console.log("   ❌ No account found");
  process.exit(1);
}

console.log(`   ✅ Account: ${account.displayName}`);
console.log(`   User ID: ${account.spotifyUserId}`);
console.log();

// Test 3: Get user profile
console.log("3️⃣ Testing User Token & Profile...");
const profileRes = await fetch("https://api.spotify.com/v1/me", {
  headers: { "Authorization": `Bearer ${account.accessToken}` },
});

if (profileRes.ok) {
  const profile = await profileRes.json();
  console.log("   ✅ User token is valid");
  console.log(`   Display Name: ${profile.display_name}`);
  console.log(`   Email: ${profile.email}`);
  console.log(`   Product: ${profile.product.toUpperCase()}`);
  console.log(`   Country: ${profile.country}`);

  if (profile.product === "free") {
    console.log("\n   ⚠️  WARNING: Account is FREE");
    console.log("   Playlist creation requires Premium!");
  } else {
    console.log("\n   ✅ Account is Premium");
  }
} else {
  console.log("   ❌ User token invalid");
  const error = await profileRes.text();
  console.log(`   Error: ${error}`);
}
console.log();

// Test 4: Check scopes
console.log("4️⃣ Checking OAuth Scopes...");
const scopes = account.scopes.split(' ');
const requiredScopes = [
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'user-library-modify',
];

let allPresent = true;
for (const scope of requiredScopes) {
  const has = scopes.includes(scope);
  console.log(`   ${has ? '✅' : '❌'} ${scope}`);
  if (!has) allPresent = false;
}

if (allPresent) {
  console.log("\n   ✅ All required scopes present");
} else {
  console.log("\n   ⚠️  Some scopes missing - reconnect account");
}
console.log();

// Test 5: Try a simple API call (read-only)
console.log("5️⃣ Testing Read Access (List Playlists)...");
const playlistsRes = await fetch("https://api.spotify.com/v1/me/playlists?limit=1", {
  headers: { "Authorization": `Bearer ${account.accessToken}` },
});

if (playlistsRes.ok) {
  console.log("   ✅ Read access works");
} else {
  console.log("   ❌ Read access failed");
  const error = await playlistsRes.text();
  console.log(`   Error: ${error}`);
}
console.log();

// Summary
console.log("═".repeat(60));
console.log("\n📊 SUMMARY\n");

const profileRes2 = await fetch("https://api.spotify.com/v1/me", {
  headers: { "Authorization": `Bearer ${account.accessToken}` },
});
const profile = await profileRes2.json();

if (profile.product !== "premium") {
  console.log("❌ PRIMARY ISSUE: Spotify FREE Account");
  console.log();
  console.log("Spotify Web API limitations for FREE accounts:");
  console.log("  - ❌ Cannot create/modify playlists");
  console.log("  - ❌ Cannot control playback");
  console.log("  - ✅ CAN read metadata and search");
  console.log();
  console.log("💡 Solution: Upgrade to Spotify Premium");
  console.log("   → https://www.spotify.com/premium/");
} else {
  console.log("✅ Account is Premium");
  console.log();
  console.log("🤔 If playlist creation still fails (403 Forbidden), possible causes:");
  console.log();
  console.log("1. Application Quota Mode");
  console.log("   → Your Spotify app might be in 'Development' mode with restrictions");
  console.log("   → Check: https://developer.spotify.com/dashboard");
  console.log("   → Look for 'Quota Mode' or 'Quota Extension'");
  console.log("   → Request 'Extended Quota Mode' if needed");
  console.log();
  console.log("2. Regional Restrictions");
  console.log(`   → Your account is in: ${profile.country}`);
  console.log("   → Some regions have API limitations");
  console.log();
  console.log("3. Application Restrictions");
  console.log("   → Check your app's Settings → Edit Settings");
  console.log("   → Ensure no IP restrictions or other limits");
  console.log();
  console.log("4. Recently Created Account/App");
  console.log("   → New accounts may have temporary restrictions");
  console.log("   → Wait 24-48 hours and try again");
  console.log();
  console.log("💡 Try creating a new Spotify application:");
  console.log("   → See: CREATE_NEW_SPOTIFY_APP.md");
}

console.log();
