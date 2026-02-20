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
