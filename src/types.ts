import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

// ============================================
// Dancing Dead Records - Type Definitions
// ============================================

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  logLevel: string;
}

export interface McpServerEntry {
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  server: Server;
  /** Factory to create a fresh Server instance per session (for Streamable HTTP) */
  createServer?: () => Server;
}

export interface McpServerInfo {
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  status: "running" | "stopped" | "error";
}

export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  version: string;
  mcpServers: number;
}

export interface McpListResponse {
  total: number;
  servers: McpServerInfo[];
}

export interface SseConnection {
  id: string;
  mcpName: string;
  connectedAt: Date;
}
