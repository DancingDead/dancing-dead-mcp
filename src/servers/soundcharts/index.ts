/**
 * Soundcharts MCP Server
 *
 * Provides comprehensive music industry analytics and data:
 * - Artist search, metadata, popularity, and audience statistics
 * - Song and album data with ISRC/UPC lookups
 * - Chart rankings across streaming platforms (Spotify, Apple Music, TikTok, etc.)
 * - Playlist tracking and similar artist discovery
 * - Concert/festival event information
 * - Cross-platform streaming metrics
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSoundchartsTools } from "./tools.js";
import { logger } from "../../config.js";
import type { McpServerEntry } from "../../types.js";

function buildSoundchartsMcpServer(): McpServer {
  const mcpServer = new McpServer({
    name: "soundcharts",
    version: "1.0.0",
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
      "Music industry search — artist/song search, platform identifiers (Spotify/Apple/YouTube IDs)",
    version: "1.0.0",
    enabled: true,
    server: defaultServer.server,
    createServer: () => buildSoundchartsMcpServer().server,
  };
}
