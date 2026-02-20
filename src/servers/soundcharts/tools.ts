// ============================================
// Soundcharts - MCP Tools (Limited API Access)
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
      limit: z.number().optional().describe("Maximum number of results (default: 10, max: 20)"),
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
      limit: z.number().optional().describe("Maximum number of results (default: 10, max: 20)"),
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

  mcpServer.tool(
    "soundcharts-search-venues",
    "Search for venues on Soundcharts by name",
    {
      query: z.string().describe("Venue name to search for"),
      limit: z.number().optional().describe("Maximum number of results (default: 10, max: 20)"),
    },
    async ({ query, limit }) => {
      try {
        const results = await client.searchVenues(query, limit);
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
    "soundcharts-search-festivals",
    "Search for festivals on Soundcharts by name",
    {
      query: z.string().describe("Festival name to search for"),
      limit: z.number().optional().describe("Maximum number of results (default: 10, max: 20)"),
    },
    async ({ query, limit }) => {
      try {
        const results = await client.searchFestivals(query, limit);
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
    "Get basic information about an artist (name, image, country, web URL)",
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
    "soundcharts-get-artist-identifiers",
    "Get artist platform identifiers (Spotify ID, Apple Music ID, YouTube channel, etc.)",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
    },
    async ({ uuid }) => {
      try {
        const identifiers = await client.getArtistIdentifiers(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(identifiers, null, 2) }],
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
    "Get enriched artist metadata (biography, birth date, gender, genres, IPI, ISNI, career stage)",
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
    "soundcharts-get-artist-events",
    "Get artist concerts and festival performances with venue details",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      limit: z.number().optional().describe("Maximum results (default: 20, max: 100)"),
    },
    async ({ uuid, startDate, endDate, limit }) => {
      try {
        const events = await client.getArtistEvents(uuid, { startDate, endDate, limit });
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

  mcpServer.tool(
    "soundcharts-get-artist-songs",
    "Get artist discography (all songs/tracks) with release dates",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      offset: z.number().optional().describe("Pagination offset (default: 0)"),
      limit: z.number().optional().describe("Results per page (default: 20, max: 100)"),
      sortBy: z.enum(["releaseDate", "name"]).optional().describe("Sort field"),
      sortOrder: z.enum(["asc", "desc"]).optional().describe("Sort order"),
    },
    async ({ uuid, offset, limit, sortBy, sortOrder }) => {
      try {
        const songs = await client.getArtistSongs(uuid, { offset, limit, sortBy, sortOrder });
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
    "soundcharts-get-artist-audience",
    "Get artist audience statistics (followers, likes) over time for Spotify or TikTok",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      platform: z.enum(["spotify", "tiktok"]).describe("Platform (spotify or tiktok)"),
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page (default: 100)"),
    },
    async ({ uuid, platform, startDate, endDate, offset, limit }) => {
      try {
        const audience = await client.getArtistAudience(uuid, platform, { startDate, endDate, offset, limit });
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
    "soundcharts-get-artist-streaming",
    "Get artist monthly listeners over time on Spotify",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page (default: 100)"),
    },
    async ({ uuid, startDate, endDate, offset, limit }) => {
      try {
        const streaming = await client.getArtistStreaming(uuid, { startDate, endDate, offset, limit });
        return {
          content: [{ type: "text", text: JSON.stringify(streaming, null, 2) }],
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
    "Get artist popularity score over time on Spotify (0-100 scale)",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page (default: 100)"),
    },
    async ({ uuid, startDate, endDate, offset, limit }) => {
      try {
        const popularity = await client.getArtistPopularity(uuid, { startDate, endDate, offset, limit });
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
    "soundcharts-get-artist-score",
    "Get Soundcharts scores (scScore, fanbaseScore, trendingScore) for an artist",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
    },
    async ({ uuid }) => {
      try {
        const score = await client.getArtistSoundchartsScore(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(score, null, 2) }],
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
    "soundcharts-get-artist-chart-ranks",
    "Get artist song chart rankings over time on Spotify charts",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page (default: 100)"),
    },
    async ({ uuid, startDate, endDate, offset, limit }) => {
      try {
        const ranks = await client.getArtistSongChartRanks(uuid, { startDate, endDate, offset, limit });
        return {
          content: [{ type: "text", text: JSON.stringify(ranks, null, 2) }],
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
    "Get basic information about a song (name, ISRC, artists, release date, label)",
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
    "soundcharts-get-song-identifiers",
    "Get song platform identifiers (Spotify ID, Apple Music ID, etc.)",
    {
      uuid: z.string().describe("Soundcharts song UUID"),
    },
    async ({ uuid }) => {
      try {
        const identifiers = await client.getSongIdentifiers(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(identifiers, null, 2) }],
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
    "soundcharts-get-song-popularity",
    "Get song popularity score over time on Spotify (0-100 scale)",
    {
      uuid: z.string().describe("Soundcharts song UUID"),
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page (default: 100)"),
    },
    async ({ uuid, startDate, endDate, offset, limit }) => {
      try {
        const popularity = await client.getSongPopularity(uuid, { startDate, endDate, offset, limit });
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
    "soundcharts-get-song-audience",
    "Get song stream counts over time on Spotify",
    {
      uuid: z.string().describe("Soundcharts song UUID"),
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page (default: 100)"),
    },
    async ({ uuid, startDate, endDate, offset, limit }) => {
      try {
        const audience = await client.getSongAudience(uuid, { startDate, endDate, offset, limit });
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
    "soundcharts-get-song-chart-ranks",
    "Get song chart rankings over time on Spotify charts",
    {
      uuid: z.string().describe("Soundcharts song UUID"),
      startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page (default: 100)"),
    },
    async ({ uuid, startDate, endDate, offset, limit }) => {
      try {
        const ranks = await client.getSongChartRanks(uuid, { startDate, endDate, offset, limit });
        return {
          content: [{ type: "text", text: JSON.stringify(ranks, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${formatError(err)}` }],
          isError: true,
        };
      }
    },
  );

  // ── Venue & Festival Tools ──────────────────

  mcpServer.tool(
    "soundcharts-get-venue",
    "Get venue details (name, location, capacity, coordinates)",
    {
      uuid: z.string().describe("Soundcharts venue UUID"),
    },
    async ({ uuid }) => {
      try {
        const venue = await client.getVenue(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(venue, null, 2) }],
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
    "soundcharts-get-festival",
    "Get festival details (name, location, venue, website)",
    {
      uuid: z.string().describe("Soundcharts festival UUID"),
    },
    async ({ uuid }) => {
      try {
        const festival = await client.getFestival(uuid);
        return {
          content: [{ type: "text", text: JSON.stringify(festival, null, 2) }],
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
    "Get list of all available streaming platforms and services",
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
