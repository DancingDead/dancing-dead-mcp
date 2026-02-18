/**
 * n8n MCP Server - Proxy to n8n-mcp (czlonkowski/n8n-mcp)
 *
 * Provides AI-assisted n8n workflow automation:
 * - 1,084 n8n nodes with full property schemas
 * - 2,709 workflow templates
 * - Node documentation (87% coverage)
 * - Pipeline creation and validation support
 *
 * Architecture: low-level Server that proxies ListTools + CallTool
 * requests to a shared n8n-mcp subprocess via MCP Client.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getN8nClient } from "./proxy.js";
import { logger } from "../../config.js";
import type { McpServerEntry } from "../../types.js";

/**
 * Builds a low-level Server that proxies all tool operations
 * to the shared n8n-mcp subprocess client.
 */
function buildN8nProxyServer(): Server {
  const server = new Server(
    { name: "n8n", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  // Proxy: list all tools from n8n-mcp
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const client = await getN8nClient();
    return await client.listTools();
  });

  // Proxy: forward tool calls to n8n-mcp
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const client = await getN8nClient();
    return await client.callTool({
      name: request.params.name,
      arguments: request.params.arguments ?? {},
    });
  });

  return server;
}

/**
 * Creates the McpServerEntry for the n8n proxy.
 * Pre-warms the n8n-mcp connection so it's ready at first request.
 */
export async function createN8nServer(): Promise<McpServerEntry> {
  // Pre-warm: connect to n8n-mcp in background (non-blocking for caller)
  getN8nClient().catch((err) => {
    logger.warn("[n8n] Pre-warm connection failed:", err);
  });

  logger.info("[n8n] n8n proxy server created (connecting to n8n-mcp...)");

  return {
    name: "n8n",
    description:
      "n8n workflow automation — nodes, templates, pipeline creation (1084 nodes, 2709 templates)",
    version: "1.0.0",
    enabled: true,
    server: buildN8nProxyServer(),
    createServer: () => buildN8nProxyServer(),
  };
}
