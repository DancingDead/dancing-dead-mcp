import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createSpotifyServer } from "./servers/spotify/index.js";
import { config, logger } from "./config.js";
import type {
  McpServerEntry,
  McpServerInfo,
  HealthResponse,
  McpListResponse,
  SseConnection,
} from "./types.js";

// ============================================
// Dancing Dead Records - MCP Central Server
// ============================================

const app = express();
const VERSION = "1.0.0";
const startTime = Date.now();

// ── Registry ────────────────────────────────

const mcpServers = new Map<string, McpServerEntry>();
const activeConnections = new Map<string, SseConnection>();
const transports = new Map<string, SSEServerTransport>();

// ── Middleware ───────────────────────────────

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ── Register MCP helper ─────────────────────

export function registerMcpServer(entry: McpServerEntry): void {
  mcpServers.set(entry.name, entry);
  logger.info(`MCP registered: ${entry.name} v${entry.version}`);
}

// ── Health ───────────────────────────────────

app.get("/health", (_req, res) => {
  const response: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: VERSION,
    mcpServers: mcpServers.size,
  };
  res.json(response);
});

// ── MCP List ────────────────────────────────

app.get("/api/mcp/list", (_req, res) => {
  const servers: McpServerInfo[] = [];
  for (const [, entry] of mcpServers) {
    servers.push({
      name: entry.name,
      description: entry.description,
      version: entry.version,
      enabled: entry.enabled,
      status: entry.enabled ? "running" : "stopped",
    });
  }
  const response: McpListResponse = { total: servers.length, servers };
  res.json(response);
});

// ── SSE endpoint (per MCP) ──────────────────

app.get("/:mcpName/sse", async (req, res) => {
  const { mcpName } = req.params;
  const entry = mcpServers.get(mcpName);

  if (!entry) {
    res.status(404).json({ error: `MCP server "${mcpName}" not found` });
    return;
  }

  if (!entry.enabled) {
    res.status(503).json({ error: `MCP server "${mcpName}" is disabled` });
    return;
  }

  const connectionId = randomUUID();
  logger.info(`SSE connect: ${mcpName} (${connectionId})`);

  const transport = new SSEServerTransport(`/${mcpName}/message`, res);
  transports.set(connectionId, transport);

  activeConnections.set(connectionId, {
    id: connectionId,
    mcpName,
    connectedAt: new Date(),
  });

  res.on("close", () => {
    logger.info(`SSE disconnect: ${mcpName} (${connectionId})`);
    transports.delete(connectionId);
    activeConnections.delete(connectionId);
  });

  try {
    await entry.server.connect(transport);
  } catch (err) {
    logger.error(`SSE error for ${mcpName}:`, err);
    transports.delete(connectionId);
    activeConnections.delete(connectionId);
  }
});

// ── Message endpoint (per MCP) ──────────────

app.post("/:mcpName/message", async (req, res) => {
  const { mcpName } = req.params;
  const entry = mcpServers.get(mcpName);

  if (!entry) {
    res.status(404).json({ error: `MCP server "${mcpName}" not found` });
    return;
  }

  const sessionId = req.query.sessionId as string | undefined;
  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId query parameter" });
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    // Try to find transport by iterating (sessionId from SSEServerTransport)
    let found: SSEServerTransport | undefined;
    for (const [, t] of transports) {
      if ((t as SSEServerTransport & { sessionId?: string }).sessionId === sessionId) {
        found = t;
        break;
      }
    }
    if (!found) {
      res.status(404).json({ error: "Session not found. Reconnect via SSE." });
      return;
    }
    await found.handlePostMessage(req, res);
    return;
  }

  await transport.handlePostMessage(req, res);
});

// ── Active connections (debug) ──────────────

app.get("/api/connections", (_req, res) => {
  const connections = Array.from(activeConnections.values());
  res.json({ total: connections.length, connections });
});

// ── Webhook deploy (GitHub → auto-deploy) ───

const __server_filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = resolve(dirname(__server_filename), "..");

app.post("/webhook/deploy", (req, res) => {
  // Only accept push events to master
  const event = req.headers["x-github-event"];
  if (event && event !== "push") {
    res.json({ status: "ignored", reason: `event: ${event}` });
    return;
  }

  const ref = req.body?.ref;
  if (ref && ref !== "refs/heads/master") {
    res.json({ status: "ignored", reason: `branch: ${ref}` });
    return;
  }

  logger.info("Webhook deploy triggered — starting git pull + build...");
  res.json({ status: "deploying" });

  // Run deploy in background so the response is sent immediately
  setTimeout(() => {
    try {
      const opts = { cwd: PROJECT_ROOT, stdio: "pipe" as const, timeout: 120_000 };
      logger.info("Running: git pull origin master");
      execSync("git pull origin master", opts);
      logger.info("Running: npm install --production=false");
      execSync("npm install --production=false", opts);
      logger.info("Running: npm run build");
      execSync("npm run build", opts);
      logger.info("Deploy complete — restarting via tmp/restart.txt");
      execSync("mkdir -p tmp && touch tmp/restart.txt", opts);
    } catch (err) {
      logger.error("Deploy failed:", err);
    }
  }, 100);
});

// ── 404 fallback ────────────────────────────

function setupFallbackRoutes(): void {
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(
      (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        logger.error("Unhandled error:", err.message);
        res.status(500).json({ error: "Internal server error" });
      }
  );
}

// ── Error handler ───────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error("Unhandled error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  },
);

// ── Bootstrap demo MCP ──────────────────────
// Register a minimal "ping" MCP so the server is immediately usable.

function bootstrapDemoServer(): void {
  const ping = new McpServer({
    name: "ping",
    version: "1.0.0",
  });

  ping.tool("ping", "Returns pong - used to test connectivity", {}, async () => {
    return { content: [{ type: "text", text: "pong" }] };
  });

  ping.tool(
    "server-info",
    "Returns information about the Dancing Dead MCP infrastructure",
    {},
    async () => {
      const info = {
        name: "Dancing Dead Records MCP",
        version: VERSION,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        registeredServers: mcpServers.size,
        activeConnections: activeConnections.size,
      };
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    },
  );

  registerMcpServer({
    name: "ping",
    description: "Connectivity test server",
    version: "1.0.0",
    enabled: true,
    server: ping.server,
  });
}

// ── Start ───────────────────────────────────

bootstrapDemoServer();

const spotifyEntry = createSpotifyServer(app);
registerMcpServer(spotifyEntry);

setupFallbackRoutes();

// o2switch/Passenger: listens on the PORT env var (set by Passenger) or defaults to 3000.
// Binding to 0.0.0.0 ensures Passenger can reach the app.
app.listen(config.port, () => {
  logger.info("================================================");
  logger.info("  Dancing Dead Records - MCP Server");
  logger.info(`  Environment : ${config.nodeEnv}`);
  logger.info(`  Port        : ${config.port}`);
  logger.info(`  Health      : /health`);
  logger.info(`  MCP list    : /api/mcp/list`);
  logger.info(`  Ping SSE    : /ping/sse`);
  logger.info(`  Spotify SSE : /spotify/sse`);
  logger.info("================================================");
});

export { app };
