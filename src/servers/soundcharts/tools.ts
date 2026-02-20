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
    "soundcharts-get-artist-albums",
    "Get artist albums, EPs, and singles with release dates and types",
    {
      uuid: z.string().describe("Soundcharts artist UUID"),
      offset: z.number().optional().describe("Pagination offset (default: 0)"),
      limit: z.number().optional().describe("Results per page (default: 20, max: 100)"),
      sortBy: z.enum(["title", "releaseDate"]).optional().describe("Sort field"),
      sortOrder: z.enum(["asc", "desc"]).optional().describe("Sort order"),
    },
    async ({ uuid, offset, limit, sortBy, sortOrder }) => {
      try {
        const albums = await client.getArtistAlbums(uuid, { offset, limit, sortBy, sortOrder });
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
