// ============================================
// Soundcharts - MCP Tools
// ============================================

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SoundchartsApiClient, formatError } from "./api.js";

export function registerSoundchartsTools(mcpServer: McpServer): void {
  const client = new SoundchartsApiClient();

  // ── Search ──────────────────────────────────

  mcpServer.tool(
    "soundcharts-search-artists",
    "Search for artists on Soundcharts by name",
    {
      query: z.string().describe("Artist name to search for"),
      limit: z.number().optional().describe("Maximum number of results (default: 10)"),
    },
    async ({ query, limit }) => {
      try {
        const results = await client.searchArtists(query, limit);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-search-songs",
    "Search for songs on Soundcharts by title",
    {
      query: z.string().describe("Song title to search for"),
      limit: z.number().optional().describe("Maximum number of results (default: 10)"),
    },
    async ({ query, limit }) => {
      try {
        const results = await client.searchSongs(query, limit);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  // ── Artist Tools ────────────────────────────

  mcpServer.tool(
    "soundcharts-get-artist",
    "Get detailed information about an artist",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
    },
    async ({ uuid }) => {
      try {
        const artist = await client.getArtist(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(artist, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-artist-metadata",
    "Get artist metadata (name, images, platform IDs, genres, etc.)",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
    },
    async ({ uuid }) => {
      try {
        const metadata = await client.getArtistMetadata(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-artist-popularity",
    "Get artist popularity metrics across streaming platforms",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      platform: z
        .string()
        .optional()
        .describe("Platform filter (spotify, apple_music, deezer, etc.)"),
    },
    async ({ uuid, platform }) => {
      try {
        const popularity = await client.getArtistPopularity(uuid, platform);
        return {
          content: [{ type: "text", text: JSON.stringify(popularity, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-artist-audience",
    "Get artist audience statistics (followers, listeners, views)",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      platform: z
        .string()
        .optional()
        .describe("Platform filter (spotify, apple_music, youtube, instagram, etc.)"),
    },
    async ({ uuid, platform }) => {
      try {
        const audience = await client.getArtistAudience(uuid, platform);
        return {
          content: [{ type: "text", text: JSON.stringify(audience, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-artist-songs",
    "Get all songs by an artist",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      limit: z.number().optional().describe("Maximum number of results (default: 50)"),
    },
    async ({ uuid, limit }) => {
      try {
        const songs = await client.getArtistSongs(uuid, limit);
        return {
          content: [{ type: "text", text: JSON.stringify(songs, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-artist-albums",
    "Get artist's discography (albums, EPs, singles)",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      limit: z.number().optional().describe("Maximum number of results (default: 50)"),
    },
    async ({ uuid, limit }) => {
      try {
        const albums = await client.getArtistAlbums(uuid, limit);
        return {
          content: [{ type: "text", text: JSON.stringify(albums, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-similar-artists",
    "Find artists similar to a given artist",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      limit: z.number().optional().describe("Maximum number of results (default: 20)"),
    },
    async ({ uuid, limit }) => {
      try {
        const similar = await client.getSimilarArtists(uuid, limit);
        return {
          content: [{ type: "text", text: JSON.stringify(similar, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-artist-events",
    "Get upcoming concerts and festival appearances for an artist",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
    },
    async ({ uuid }) => {
      try {
        const events = await client.getArtistEvents(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(events, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  // ── Song Tools ──────────────────────────────

  mcpServer.tool(
    "soundcharts-get-song",
    "Get detailed information about a song",
    {
      uuid: z.string().describe("Soundcharts song UUID"),
    },
    async ({ uuid }) => {
      try {
        const song = await client.getSong(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(song, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-song-metadata",
    "Get song metadata (title, artist, ISRC, release date, etc.)",
    {
      uuid: z.string().describe("Soundcharts song UUID"),
    },
    async ({ uuid }) => {
      try {
        const metadata = await client.getSongMetadata(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-song-by-isrc",
    "Look up a song by ISRC code",
    {
      isrc: z.string().describe("ISRC code (International Standard Recording Code)"),
    },
    async ({ isrc }) => {
      try {
        const song = await client.getSongByIsrc(isrc);
        return {
          content: [{ type: "text", text: JSON.stringify(song, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-song-audience",
    "Get song streaming statistics and audience data",
    {
      uuid: z.string().describe("Soundcharts song UUID"),
      platform: z.string().optional().describe("Platform filter (spotify, apple_music, etc.)"),
    },
    async ({ uuid, platform }) => {
      try {
        const audience = await client.getSongAudience(uuid, platform);
        return {
          content: [{ type: "text", text: JSON.stringify(audience, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  // ── Album Tools ─────────────────────────────

  mcpServer.tool(
    "soundcharts-get-album-metadata",
    "Get album metadata (title, artist, UPC, release date, etc.)",
    {
      uuid: z.string().describe("Soundcharts album UUID"),
    },
    async ({ uuid }) => {
      try {
        const metadata = await client.getAlbumMetadata(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-album-by-upc",
    "Look up an album by UPC barcode",
    {
      upc: z.string().describe("UPC code (Universal Product Code)"),
    },
    async ({ upc }) => {
      try {
        const album = await client.getAlbumByUpc(upc);
        return {
          content: [{ type: "text", text: JSON.stringify(album, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-album-tracklisting",
    "Get complete tracklisting for an album",
    {
      uuid: z.string().describe("Soundcharts album UUID"),
    },
    async ({ uuid }) => {
      try {
        const tracklisting = await client.getAlbumTracklisting(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(tracklisting, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  // ── Chart Tools ─────────────────────────────

  mcpServer.tool(
    "soundcharts-get-song-charts",
    "Get song chart rankings across platforms and countries",
    {
      platform: z.string().optional().describe("Platform (spotify, apple_music, etc.)"),
      country: z.string().optional().describe("Country code (US, GB, FR, etc.)"),
      chartType: z.string().optional().describe("Chart type (top, viral, etc.)"),
      date: z.string().optional().describe("Date in YYYY-MM-DD format"),
    },
    async ({ platform, country, chartType, date }) => {
      try {
        const charts = await client.getSongChartRankings({ platform, country, chartType, date });
        return {
          content: [{ type: "text", text: JSON.stringify(charts, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-album-charts",
    "Get album chart rankings across platforms and countries",
    {
      platform: z.string().optional().describe("Platform (spotify, apple_music, etc.)"),
      country: z.string().optional().describe("Country code (US, GB, FR, etc.)"),
      chartType: z.string().optional().describe("Chart type (top, etc.)"),
      date: z.string().optional().describe("Date in YYYY-MM-DD format"),
    },
    async ({ platform, country, chartType, date }) => {
      try {
        const charts = await client.getAlbumChartRankings({ platform, country, chartType, date });
        return {
          content: [{ type: "text", text: JSON.stringify(charts, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-tiktok-charts",
    "Get TikTok music charts",
    {
      country: z.string().optional().describe("Country code (US, GB, FR, etc.)"),
    },
    async ({ country }) => {
      try {
        const charts = await client.getTikTokChartRankings(country);
        return {
          content: [{ type: "text", text: JSON.stringify(charts, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  // ── Playlist Tools ──────────────────────────

  mcpServer.tool(
    "soundcharts-get-playlist",
    "Get playlist information",
    {
      uuid: z.string().describe("Soundcharts playlist UUID"),
    },
    async ({ uuid }) => {
      try {
        const playlist = await client.getPlaylist(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(playlist, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-playlist-tracklisting",
    "Get playlist tracklisting with all songs",
    {
      uuid: z.string().describe("Soundcharts playlist UUID"),
    },
    async ({ uuid }) => {
      try {
        const tracklisting = await client.getPlaylistTracklisting(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(tracklisting, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  // ── Referential Data Tools ──────────────────

  mcpServer.tool(
    "soundcharts-get-platforms",
    "Get list of all available streaming platforms",
    {},
    async () => {
      try {
        const platforms = await client.getPlatforms();
        return {
          content: [{ type: "text", text: JSON.stringify(platforms, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  mcpServer.tool(
    "soundcharts-get-genres",
    "Get list of all music genres",
    {},
    async () => {
      try {
        const genres = await client.getGenres();
        return {
          content: [{ type: "text", text: JSON.stringify(genres, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );
}
