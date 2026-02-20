// ============================================
// Soundcharts - API Client
// ============================================

import fetch from "node-fetch";
import { getSoundchartsConfig } from "./config.js";
import { logger } from "../../config.js";

export class SoundchartsApiClient {
  private config = getSoundchartsConfig();

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    }

    logger.debug(`[soundcharts] ${url.toString()}`);

    const response = await fetch(url.toString(), {
      headers: {
        "x-app-id": this.config.appId,
        "x-api-key": this.config.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Soundcharts API error ${response.status}: ${errorText || response.statusText}`,
      );
    }

    return (await response.json()) as T;
  }

  // ── Search ──────────────────────────────────

  async searchArtists(query: string, limit = 10): Promise<any> {
    const encodedQuery = encodeURIComponent(query);
    return this.makeRequest(`/api/v2/artist/search/${encodedQuery}`, { limit: String(limit) });
  }

  async searchSongs(query: string, limit = 10): Promise<any> {
    const encodedQuery = encodeURIComponent(query);
    return this.makeRequest(`/api/v2/song/search/${encodedQuery}`, { limit: String(limit) });
  }

  // ── Artist ──────────────────────────────────

  async getArtist(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/artist/${uuid}`);
  }

  async getArtistIdentifiers(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/artist/${uuid}/identifiers`);
  }

  // ── Referential Data ────────────────────────

  async getPlatforms(): Promise<any> {
    return this.makeRequest("/api/v2/referential/platforms");
  }

  async getGenres(): Promise<any> {
    return this.makeRequest("/api/v2/referential/genres");
  }
}

export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
