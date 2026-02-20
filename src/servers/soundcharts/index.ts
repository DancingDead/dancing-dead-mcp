/**
 * Soundcharts MCP Server
 *
 * Provides comprehensive music industry analytics and data (24 tools):
 *
 * Search (4 tools):
 * - Artists, songs, venues, and festivals by name
 *
 * Artist Analytics (11 tools):
 * - Basic info, metadata, platform identifiers
 * - Discography (songs), concerts/festival events
 * - Audience metrics (Spotify/TikTok followers over time)
 * - Streaming metrics (monthly listeners)
 * - Popularity scores (0-100 scale over time)
 * - Soundcharts scores (scScore, fanbaseScore, trendingScore)
 * - Chart rankings (song performance on Spotify charts)
 *
 * Song Analytics (5 tools):
 * - Basic info, platform identifiers
 * - Popularity scores and stream counts over time
 * - Chart rankings on Spotify
 *
 * Venues & Festivals (2 tools):
 * - Venue and festival details (location, capacity, website)
 *
 * Referential Data (2 tools):
 * - Platform and genre catalogs
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSoundchartsTools } from "./tools.js";
import { logger } from "../../config.js";
import type { McpServerEntry } from "../../types.js";

function buildSoundchartsMcpServer(): McpServer {
  const mcpServer = new McpServer({
    name: "soundcharts",
    version: "2.0.0",
  });
  registerSoundchartsTools(mcpServer);
  return mcpServer;
}

export function createSoundchartsServer(): McpServerEntry {
  const defaultServer = buildSoundchartsMcpServer();
  logger.info("Soundcharts MCP tools registered");

  return {
    name: "soundcharts",
    description:
      "Music industry analytics — search (artists/songs/venues/festivals), artist analytics (audience/streaming/popularity/scores/charts), song analytics, event tracking (24 tools)",
    version: "2.0.0",
    enabled: true,
    server: defaultServer.server,
    createServer: () => buildSoundchartsMcpServer().server,
  };
}
