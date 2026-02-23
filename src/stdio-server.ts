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
  console.error("Available servers: spotify, image-gen, soundcharts, google-calendar, ping, n8n");
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

      case "image-gen": {
        console.error(`[stdio-server] Loading image-gen tools...`);
        const { registerImageGenTools } = await import("./servers/image-gen/tools.js");
        mcpServer = new McpServer({
          name: "image-gen",
          version: "1.0.0",
        });
        registerImageGenTools(mcpServer);
        console.error(`[stdio-server] Image-gen tools registered successfully`);
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

      case "soundcharts": {
        console.error(`[stdio-server] Loading Soundcharts tools...`);
        const { registerSoundchartsTools } = await import("./servers/soundcharts/tools.js");
        mcpServer = new McpServer({
          name: "soundcharts",
          version: "1.0.0",
        });
        registerSoundchartsTools(mcpServer);
        console.error(`[stdio-server] Soundcharts tools registered successfully`);
        break;
      }

      case "google-calendar": {
        console.error(`[stdio-server] Loading Google Calendar tools...`);
        const { registerGoogleCalendarTools } = await import("./servers/google-calendar/tools.js");
        mcpServer = new McpServer({
          name: "google-calendar",
          version: "1.0.0",
        });
        registerGoogleCalendarTools(mcpServer);
        console.error(`[stdio-server] Google Calendar tools registered successfully`);
        break;
      }

      case "n8n": {
        console.error(`[stdio-server] Loading n8n-mcp proxy...`);
        // Spawn n8n-mcp as a child process and proxy via MCP Client
        const { getN8nClient } = await import("./servers/n8n/proxy.js");
        const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
        const { ListToolsRequestSchema, CallToolRequestSchema } = await import(
          "@modelcontextprotocol/sdk/types.js"
        );

        const n8nServer = new Server(
          { name: "n8n", version: "1.0.0" },
          { capabilities: { tools: {} } },
        );

        n8nServer.setRequestHandler(ListToolsRequestSchema, async () => {
          const client = await getN8nClient();
          return await client.listTools();
        });

        n8nServer.setRequestHandler(CallToolRequestSchema, async (request) => {
          const client = await getN8nClient();
          return await client.callTool({
            name: request.params.name,
            arguments: request.params.arguments ?? {},
          });
        });

        // Connect to stdio transport (note: getN8nClient spawns its own subprocess,
        // so the parent stdio is free for the MCP protocol with Claude Desktop)
        const stdioTransport = new StdioServerTransport();
        await n8nServer.connect(stdioTransport);
        console.error(`[stdio-server] n8n proxy connected via stdio`);

        process.on("SIGINT", async () => {
          console.error(`[stdio-server] Received SIGINT, shutting down n8n...`);
          const { closeN8nClient } = await import("./servers/n8n/proxy.js");
          await closeN8nClient();
          await n8nServer.close();
          process.exit(0);
        });

        process.on("SIGTERM", async () => {
          console.error(`[stdio-server] Received SIGTERM, shutting down n8n...`);
          const { closeN8nClient } = await import("./servers/n8n/proxy.js");
          await closeN8nClient();
          await n8nServer.close();
          process.exit(0);
        });

        // n8n server manages its own lifecycle — return early to skip default connect
        return;
      }

      default:
        console.error(`Unknown server: ${SERVER_NAME}`);
        console.error("Available servers: spotify, image-gen, soundcharts, google-calendar, ping, n8n");
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
