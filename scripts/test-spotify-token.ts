#!/usr/bin/env tsx
/**
 * Test Spotify Token
 * Checks if the stored token is valid and has the right scopes
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const STORE_PATH = join(process.cwd(), "data", "spotify-accounts.json");

console.log("🔍 Spotify Token Tester");
console.log("========================\n");

// Load store
const storeContent = await readFile(STORE_PATH, "utf-8");
const store = JSON.parse(storeContent);

const accountName = "dancing-dead";
const account = store[accountName];

if (!account) {
  console.error(`❌ Account "${accountName}" not found`);
  process.exit(1);
}

console.log("📋 Account Info:");
console.log(`   Name: ${accountName}`);
console.log(`   Display Name: ${account.displayName}`);
console.log(`   User ID: ${account.spotifyUserId}`);
console.log(`   Added: ${account.addedAt}`);
console.log(`   Token Expires: ${new Date(account.expiresAt).toISOString()}`);
console.log(`   Scopes: ${account.scopes.split(' ').length} scopes`);
console.log();

// Check if token is expired
const now = Date.now();
const expiresAt = account.expiresAt;
const isExpired = now >= expiresAt;
const timeLeft = Math.floor((expiresAt - now) / 1000);

console.log("⏰ Token Status:");
if (isExpired) {
  console.log(`   ❌ EXPIRED (${Math.abs(timeLeft)} seconds ago)`);
} else {
  console.log(`   ✅ Valid (expires in ${timeLeft} seconds / ${Math.floor(timeLeft / 60)} minutes)`);
}
console.log();

// Check scopes
const scopes = account.scopes.split(' ');
const requiredScopes = [
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'user-read-private',
];

console.log("🔐 Scopes Check:");
for (const scope of requiredScopes) {
  const has = scopes.includes(scope);
  console.log(`   ${has ? '✅' : '❌'} ${scope}`);
}
console.log();

// Test the token with a real API call
console.log("🧪 Testing token with Spotify API...\n");

const response = await fetch("https://api.spotify.com/v1/me", {
  headers: {
    "Authorization": `Bearer ${account.accessToken}`,
  },
});

console.log(`Response: ${response.status} ${response.statusText}`);

if (response.ok) {
  const profile = await response.json();
  console.log("\n✅ Token is VALID!");
  console.log(`   Display Name: ${profile.display_name}`);
  console.log(`   Email: ${profile.email}`);
  console.log(`   Product: ${profile.product}`);
  console.log(`   Country: ${profile.country}`);
} else {
  const errorText = await response.text();
  console.log("\n❌ Token is INVALID or expired!");
  console.log(`   Error: ${errorText.substring(0, 200)}`);
  console.log("\n💡 Solution: Reconnect the account:");
  console.log(`   Use spotify-auth to connect account "dancing-dead"`);
}
