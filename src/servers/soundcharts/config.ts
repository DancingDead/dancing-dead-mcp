// ============================================
// Soundcharts - Configuration
// ============================================

export interface SoundchartsConfig {
  appId: string;
  apiKey: string;
  baseUrl: string;
}

export function getSoundchartsConfig(): SoundchartsConfig {
  const appId = process.env.SOUNDCHARTS_APP_ID;
  const apiKey = process.env.SOUNDCHARTS_API_KEY;

  if (!appId) {
    throw new Error("SOUNDCHARTS_APP_ID must be set in .env");
  }

  if (!apiKey) {
    throw new Error("SOUNDCHARTS_API_KEY must be set in .env");
  }

  return {
    appId,
    apiKey,
    baseUrl: process.env.SOUNDCHARTS_BASE_URL || "https://customer.api.soundcharts.com",
  };
}
