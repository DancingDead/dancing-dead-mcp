import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Application } from "express";
import { mountAuthRoutes } from "./auth.js";
import { registerSpotifyTools } from "./tools.js";
import { logger } from "../../config.js";
import type { McpServerEntry } from "../../types.js";

export function createSpotifyServer(app: Application): McpServerEntry {
    const mcpServer = new McpServer({
        name: "spotify",
        version: "1.1.0",
    });

    // Monter la route OAuth callback sur Express
    mountAuthRoutes(app);
    logger.info("Spotify OAuth callback mounted at /spotify/callback");

    // Enregistrer tous les tools
    registerSpotifyTools(mcpServer);
    logger.info("Spotify MCP tools registered");

    return {
        name: "spotify",
        description: "Spotify - playlists, playback, search, library management",
        version: "1.1.0",
        enabled: true,
        server: mcpServer.server,
    };
}
