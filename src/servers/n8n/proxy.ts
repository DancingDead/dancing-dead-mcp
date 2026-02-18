/**
 * n8n-mcp Proxy Client
 *
 * Singleton MCP Client that spawns an n8n-mcp subprocess (via npx) and keeps
 * the connection alive for the lifetime of the hub process.
 *
 * All n8n proxy servers share this single client to avoid spawning multiple
 * subprocesses.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { logger } from "../../config.js";

let sharedClient: Client | null = null;
let initPromise: Promise<Client> | null = null;

/**
 * Returns the shared MCP Client connected to the n8n-mcp subprocess.
 * Initializes on first call; subsequent calls return the cached client.
 */
export async function getN8nClient(): Promise<Client> {
  if (sharedClient) return sharedClient;
  if (initPromise) return initPromise;

  initPromise = (async (): Promise<Client> => {
    logger.info("[n8n] Spawning n8n-mcp subprocess via npx...");

    const childEnv: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][],
      ),
      MCP_MODE: "stdio",
      LOG_LEVEL: "error",
      DISABLE_CONSOLE_OUTPUT: "true",
    };

    if (process.env.N8N_API_URL) childEnv.N8N_API_URL = process.env.N8N_API_URL;
    if (process.env.N8N_API_KEY) childEnv.N8N_API_KEY = process.env.N8N_API_KEY;

    const transport = new StdioClientTransport({
      command: "npx",
      args: ["--yes", "n8n-mcp"],
      env: childEnv,
    });

    const client = new Client(
      { name: "dancing-dead-n8n-proxy", version: "1.0.0" },
      { capabilities: {} },
    );

    await client.connect(transport);
    sharedClient = client;
    logger.info("[n8n] Connected to n8n-mcp subprocess");
    return client;
  })();

  return initPromise;
}

/**
 * Closes the shared n8n-mcp client (called on process shutdown).
 */
export async function closeN8nClient(): Promise<void> {
  if (sharedClient) {
    await sharedClient.close();
    sharedClient = null;
    initPromise = null;
    logger.info("[n8n] n8n-mcp client closed");
  }
}
