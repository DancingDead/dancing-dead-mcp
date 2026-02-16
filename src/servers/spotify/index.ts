import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Application } from "express";
import { mountAuthRoutes } from "./auth.js";
import { registerSpotifyTools } from "./tools.js";
import { logger } from "../../config.js";
import type { McpServerEntry } from "../../types.js";

function buildSpotifyMcpServer(): McpServer {
    const mcpServer = new McpServer({
        name: "spotify",
        version: "1.1.0",
    });
    registerSpotifyTools(mcpServer);
    return mcpServer;
}

export function createSpotifyServer(app: Application): McpServerEntry {
    // Mount OAuth routes once on Express
    mountAuthRoutes(app);
    logger.info("Spotify OAuth callback mounted at /spotify/callback");

    // Build a default instance for the registry
    const defaultServer = buildSpotifyMcpServer();
    logger.info("Spotify MCP tools registered");

    return {
        name: "spotify",
        description: "Spotify - playlists, playback, search, library management",
        version: "1.1.0",
        enabled: true,
        server: defaultServer.server,
        createServer: () => buildSpotifyMcpServer().server,
    };
}
