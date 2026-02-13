#!/usr/bin/env tsx
/**
 * Debug OAuth Error
 * Simulates the token exchange to see the exact error from Spotify
 */

import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env
config({ path: resolve(process.cwd(), ".env") });

const clientId = process.env.SPOTIFY_CLIENT_ID!;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/spotify/callback";

console.log("🐛 OAuth Error Debugger");
console.log("=======================\n");

console.log("📋 Configuration:");
console.log(`   Client ID: ${clientId}`);
console.log(`   Redirect URI: ${redirectUri}\n`);

// Simulate token exchange with a fake code
console.log("⚠️  Attempting token exchange with fake code to trigger error...\n");

const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const response = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Authorization": `Basic ${authString}`,
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code: "FAKE_CODE_FOR_TESTING",
    redirect_uri: redirectUri,
  }),
});

console.log(`Response status: ${response.status} ${response.statusText}\n`);

const responseText = await response.text();

console.log("📄 Raw Response:");
console.log("─".repeat(60));
console.log(responseText.substring(0, 1000));
console.log("─".repeat(60));
console.log("\n");

// Try to parse as JSON
try {
  const jsonData = JSON.parse(responseText);
  console.log("✅ Response is valid JSON:");
  console.log(JSON.stringify(jsonData, null, 2));

  if (jsonData.error) {
    console.log("\n❌ Spotify Error:");
    console.log(`   Error: ${jsonData.error}`);
    console.log(`   Description: ${jsonData.error_description || 'N/A'}`);

    if (jsonData.error === "invalid_grant") {
      console.log("\n💡 This is EXPECTED with a fake code.");
      console.log("   The redirect URI is CORRECT!");
      console.log("   Try the real OAuth flow now.");
    }
  }
} catch (err) {
  console.log("❌ Response is NOT valid JSON (This is the problem!)");
  console.log("\n🔍 Analysis:");

  if (responseText.includes("Check") || responseText.includes("settings")) {
    console.log("   Spotify is showing an error page about settings.");
    console.log("\n🎯 SOLUTION:");
    console.log("   1. The redirect URI in Spotify Dashboard doesn't match!");
    console.log("   2. Go to: https://developer.spotify.com/dashboard");
    console.log("   3. Select your app → Edit Settings");
    console.log("   4. In 'Redirect URIs', ADD EXACTLY:");
    console.log(`      ${redirectUri}`);
    console.log("   5. Click 'Add' then 'Save' at the bottom");
    console.log("\n⚠️  Common mistakes:");
    console.log("   • Trailing slash: http://127.0.0.1:3000/ (WRONG)");
    console.log("   • Missing path: http://127.0.0.1:3000 (WRONG)");
    console.log("   • Using localhost: http://localhost:3000/spotify/callback (WRONG if Spotify rejects it)");
    console.log(`   • Correct: ${redirectUri}`);
  } else {
    console.log("   Unknown HTML response from Spotify");
    console.log(`   First 200 chars: ${responseText.substring(0, 200)}`);
  }
}
