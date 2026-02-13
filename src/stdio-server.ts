#!/usr/bin/env node
/**
 * MCP Stdio Server - Standalone stdio server for Claude Desktop
 *
 * This allows running individual MCP servers in stdio mode for Claude Desktop.
 * Usage: tsx src/stdio-server.ts <server-name>
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Load .env file from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
config({ path: resolve(projectRoot, ".env") });

const SERVER_NAME = process.argv[2];

if (!SERVER_NAME) {
  console.error("Usage: stdio-server <server-name>");
  console.error("Available servers: spotify, ping");
  process.exit(1);
}

// Log startup (to stderr to not interfere with stdio protocol)
console.error(`[stdio-server] Starting ${SERVER_NAME} MCP server...`);

async function main() {
  let mcpServer: McpServer;

  try {
    switch (SERVER_NAME) {
      case "spotify": {
        // Create Spotify server without HTTP app
        console.error(`[stdio-server] Loading Spotify tools...`);
        const { registerSpotifyTools } = await import("./servers/spotify/tools.js");
        mcpServer = new McpServer({
          name: "spotify",
          version: "1.1.0",
        });
        registerSpotifyTools(mcpServer);
        console.error(`[stdio-server] Spotify tools registered successfully`);
        break;
      }

      case "ping": {
        console.error(`[stdio-server] Loading ping server...`);
        mcpServer = new McpServer({
          name: "ping",
          version: "1.0.0",
        });
        mcpServer.tool("ping", "Returns pong - test connectivity", {}, async () => {
          return { content: [{ type: "text", text: "pong" }] };
        });
        console.error(`[stdio-server] Ping server ready`);
        break;
      }

      default:
        console.error(`Unknown server: ${SERVER_NAME}`);
        console.error("Available servers: spotify, ping");
        process.exit(1);
    }

    console.error(`[stdio-server] Connecting to stdio transport...`);
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error(`[stdio-server] ${SERVER_NAME} MCP server connected successfully`);

    // Keep the process alive
    process.on("SIGINT", async () => {
      console.error(`[stdio-server] Received SIGINT, shutting down...`);
      await mcpServer.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.error(`[stdio-server] Received SIGTERM, shutting down...`);
      await mcpServer.close();
      process.exit(0);
    });
  } catch (error) {
    console.error(`[stdio-server] Fatal error:`, error);
    throw error;
  }
}

main().catch((error) => {
  console.error("[stdio-server] Unhandled error:", error);
  console.error("[stdio-server] Stack trace:", error?.stack);
  process.exit(1);
});
