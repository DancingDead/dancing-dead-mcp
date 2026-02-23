import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Application } from "express";
import { mountAuthRoutes } from "./auth.js";
import { registerGoogleCalendarTools } from "./tools.js";
import { logger } from "../../config.js";
import type { McpServerEntry } from "../../types.js";

function buildGoogleCalendarMcpServer(): McpServer {
    const mcpServer = new McpServer({
        name: "google-calendar",
        version: "1.0.0",
    });
    registerGoogleCalendarTools(mcpServer);
    return mcpServer;
}

export function createGoogleCalendarServer(app: Application): McpServerEntry {
    // Mount OAuth routes once on Express
    mountAuthRoutes(app);
    logger.info("Google Calendar OAuth callback mounted at /google-calendar/callback");

    // Build a default instance for the registry
    const defaultServer = buildGoogleCalendarMcpServer();
    logger.info("Google Calendar MCP tools registered");

    return {
        name: "google-calendar",
        description: "Google Calendar - create, list, update, and delete events",
        version: "1.0.0",
        enabled: true,
        server: defaultServer.server,
        createServer: () => buildGoogleCalendarMcpServer().server,
    };
}