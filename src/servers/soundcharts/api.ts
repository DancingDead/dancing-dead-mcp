// ============================================
// Soundcharts - API Client
// ============================================

import fetch from "node-fetch";
import { getSoundchartsConfig } from "./config.js";
import { logger } from "../../config.js";

export interface SoundchartsArtist {
  uuid: string;
  name: string;
  imageUrl?: string;
  spotifyId?: string;
  appleMusicId?: string;
  deezerId?: string;
}

export interface SoundchartsSong {
  uuid: string;
  name: string;
  artistName?: string;
  isrc?: string;
  releaseDate?: string;
}

export interface ChartEntry {
  position: number;
  previousPosition?: number;
  peakPosition?: number;
  weeksOnChart?: number;
  song?: SoundchartsSong;
}

export interface AudienceData {
  platform: string;
  followers?: number;
  listeners?: number;
  views?: number;
  lastUpdated?: string;
}

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
    return this.makeRequest("/api/v2/artist/search", { query, limit: String(limit) });
  }

  async searchSongs(query: string, limit = 10): Promise<any> {
    return this.makeRequest("/api/v2/song/search", { query, limit: String(limit) });
  }

  // ── Artist ──────────────────────────────────

  async getArtist(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/artist/${uuid}`);
  }

  async getArtistMetadata(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/artist/${uuid}/metadata`);
  }

  async getArtistPopularity(uuid: string, platform?: string): Promise<any> {
    const params = platform ? { platform } : undefined;
    return this.makeRequest(`/api/v2/artist/${uuid}/popularity`, params);
  }

  async getArtistAudience(uuid: string, platform?: string): Promise<any> {
    const params = platform ? { platform } : undefined;
    return this.makeRequest(`/api/v2/artist/${uuid}/audience`, params);
  }

  async getArtistSongs(uuid: string, limit = 50): Promise<any> {
    return this.makeRequest(`/api/v2/artist/${uuid}/songs`, { limit: String(limit) });
  }

  async getArtistAlbums(uuid: string, limit = 50): Promise<any> {
    return this.makeRequest(`/api/v2/artist/${uuid}/albums`, { limit: String(limit) });
  }

  async getSimilarArtists(uuid: string, limit = 20): Promise<any> {
    return this.makeRequest(`/api/v2/artist/${uuid}/similar`, { limit: String(limit) });
  }

  async getArtistEvents(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/artist/${uuid}/events`);
  }

  // ── Song ────────────────────────────────────

  async getSong(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/song/${uuid}`);
  }

  async getSongMetadata(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/song/${uuid}/metadata`);
  }

  async getSongByIsrc(isrc: string): Promise<any> {
    return this.makeRequest(`/api/v2/song/by-isrc/${isrc}`);
  }

  async getSongAudience(uuid: string, platform?: string): Promise<any> {
    const params = platform ? { platform } : undefined;
    return this.makeRequest(`/api/v2/song/${uuid}/audience`, params);
  }

  // ── Album ───────────────────────────────────

  async getAlbumMetadata(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/album/${uuid}/metadata`);
  }

  async getAlbumByUpc(upc: string): Promise<any> {
    return this.makeRequest(`/api/v2/album/by-upc/${upc}`);
  }

  async getAlbumTracklisting(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/album/${uuid}/tracklisting`);
  }

  // ── Charts ──────────────────────────────────

  async getSongChartRankings(
    params: {
      platform?: string;
      country?: string;
      chartType?: string;
      date?: string;
    } = {},
  ): Promise<any> {
    const queryParams: Record<string, string> = {};
    if (params.platform) queryParams.platform = params.platform;
    if (params.country) queryParams.country = params.country;
    if (params.chartType) queryParams.type = params.chartType;
    if (params.date) queryParams.date = params.date;

    return this.makeRequest("/api/v2/charts/song-ranking", queryParams);
  }

  async getAlbumChartRankings(
    params: {
      platform?: string;
      country?: string;
      chartType?: string;
      date?: string;
    } = {},
  ): Promise<any> {
    const queryParams: Record<string, string> = {};
    if (params.platform) queryParams.platform = params.platform;
    if (params.country) queryParams.country = params.country;
    if (params.chartType) queryParams.type = params.chartType;
    if (params.date) queryParams.date = params.date;

    return this.makeRequest("/api/v2/charts/album-ranking", queryParams);
  }

  async getTikTokChartRankings(country?: string): Promise<any> {
    const params = country ? { country } : undefined;
    return this.makeRequest("/api/v2/charts/tiktok-ranking", params);
  }

  // ── Playlists ───────────────────────────────

  async getPlaylist(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/playlist/${uuid}`);
  }

  async getPlaylistTracklisting(uuid: string): Promise<any> {
    return this.makeRequest(`/api/v2/playlist/${uuid}/tracklisting`);
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
