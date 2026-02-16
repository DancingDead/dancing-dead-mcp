// ============================================
// Image Generation - MCP Server Factory
// ============================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerImageGenTools } from "./tools.js";
import { logger } from "../../config.js";
import type { McpServerEntry } from "../../types.js";

function buildImageGenMcpServer(): McpServer {
  const mcpServer = new McpServer({
    name: "image-gen",
    version: "1.0.0",
  });
  registerImageGenTools(mcpServer);
  return mcpServer;
}

export function createImageGenServer(): McpServerEntry {
  const defaultServer = buildImageGenMcpServer();
  logger.info("Image-gen MCP tools registered");

  return {
    name: "image-gen",
    description: "Image generation via HuggingFace (FLUX / configurable model)",
    version: "1.0.0",
    enabled: true,
    server: defaultServer.server,
    createServer: () => buildImageGenMcpServer().server,
  };
}
