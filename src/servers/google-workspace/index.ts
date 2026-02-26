import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Application } from "express";
import { mountAuthRoutes } from "./auth.js";
import { registerGoogleWorkspaceTools } from "./tools.js";
import { logger } from "../../config.js";
import type { McpServerEntry } from "../../types.js";

function buildGoogleWorkspaceMcpServer(): McpServer {
    const mcpServer = new McpServer({
        name: "google-workspace",
        version: "1.0.0",
    });
    registerGoogleWorkspaceTools(mcpServer);
    return mcpServer;
}

export function createGoogleWorkspaceServer(app: Application): McpServerEntry {
    // Mount OAuth routes once on Express
    mountAuthRoutes(app);
    logger.info("Google Workspace OAuth callback mounted at /google-workspace/callback");

    // Build a default instance for the registry
    const defaultServer = buildGoogleWorkspaceMcpServer();
    logger.info("Google Workspace MCP tools registered");

    return {
        name: "google-workspace",
        description: "Google Workspace - Calendar, Tasks, Drive, Sheets, Docs, Gmail, Slides",
        version: "1.0.0",
        enabled: true,
        server: defaultServer.server,
        createServer: () => buildGoogleWorkspaceMcpServer().server,
    };
}
