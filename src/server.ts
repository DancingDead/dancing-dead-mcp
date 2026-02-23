import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createSpotifyServer } from "./servers/spotify/index.js";
import { createImageGenServer } from "./servers/image-gen/index.js";
import { createN8nServer } from "./servers/n8n/index.js";
import { createSoundchartsServer } from "./servers/soundcharts/index.js";
import { createGoogleCalendarServer } from "./servers/google-calendar/index.js";
import { config, logger } from "./config.js";
import type {
  McpServerEntry,
  McpServerInfo,
  HealthResponse,
  McpListResponse,
} from "./types.js";

// ============================================
// Dancing Dead Records - MCP Central Server
// ============================================

const app = express();
const VERSION = "1.0.0";
const startTime = Date.now();

// ── Registry ────────────────────────────────

const mcpServers = new Map<string, McpServerEntry>();

// Streamable HTTP: one transport per session
const streamableSessions = new Map<string, StreamableHTTPServerTransport>();

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

// ── Streamable HTTP endpoint (per MCP) ──────
// Handles POST (client→server messages) and GET (server→client SSE stream)
// at /:mcpName/mcp

async function handleStreamableRequest(
  req: express.Request,
  res: express.Response,
  mcpName: string,
): Promise<void> {
  const entry = mcpServers.get(mcpName);

  if (!entry) {
    res.status(404).json({ error: `MCP server "${mcpName}" not found` });
    return;
  }

  if (!entry.enabled) {
    res.status(503).json({ error: `MCP server "${mcpName}" is disabled` });
    return;
  }

  // Check for existing session
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && streamableSessions.has(sessionId)) {
    // Existing session — route to its transport
    const transport = streamableSessions.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  if (sessionId && !streamableSessions.has(sessionId)) {
    // Invalid session ID
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // No session ID — new initialization request
  // Create a fresh MCP server instance for this session
  const server = entry.createServer ? entry.createServer() : entry.server;

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  });

  transport.onclose = () => {
    const sid = transport.sessionId;
    if (sid) {
      logger.info(`Streamable HTTP session closed: ${mcpName} (${sid})`);
      streamableSessions.delete(sid);
    }
  };

  await server.connect(transport);

  // Store the session after connect (sessionId is set during handleRequest)
  await transport.handleRequest(req, res, req.body);

  if (transport.sessionId) {
    streamableSessions.set(transport.sessionId, transport);
    logger.info(`Streamable HTTP session created: ${mcpName} (${transport.sessionId})`);
  }
}

// POST /:mcpName/mcp — client messages (initialize, tool calls, etc.)
app.post("/:mcpName/mcp", async (req, res) => {
  const { mcpName } = req.params;
  try {
    await handleStreamableRequest(req, res, mcpName);
  } catch (err) {
    logger.error(`Streamable HTTP error for ${mcpName}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// GET /:mcpName/mcp — server→client SSE notification stream
app.get("/:mcpName/mcp", async (req, res) => {
  const { mcpName } = req.params;
  try {
    await handleStreamableRequest(req, res, mcpName);
  } catch (err) {
    logger.error(`Streamable HTTP GET error for ${mcpName}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// DELETE /:mcpName/mcp — session termination
app.delete("/:mcpName/mcp", async (req, res) => {
  const { mcpName } = req.params;
  try {
    await handleStreamableRequest(req, res, mcpName);
  } catch (err) {
    logger.error(`Streamable HTTP DELETE error for ${mcpName}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// ── Active sessions (debug) ─────────────────

app.get("/api/connections", (_req, res) => {
  const sessions = Array.from(streamableSessions.entries()).map(([id, t]) => ({
    sessionId: id,
    transportSessionId: t.sessionId,
  }));
  res.json({ total: sessions.length, sessions });
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

// ── Bootstrap demo MCP ──────────────────────

function buildPingServer(): McpServer {
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
        activeConnections: streamableSessions.size,
      };
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    },
  );

  return ping;
}

function bootstrapDemoServer(): void {
  const ping = buildPingServer();

  registerMcpServer({
    name: "ping",
    description: "Connectivity test server",
    version: "1.0.0",
    enabled: true,
    server: ping.server,
    createServer: () => buildPingServer().server,
  });
}

// ── Start ───────────────────────────────────

bootstrapDemoServer();

const spotifyEntry = createSpotifyServer(app);
registerMcpServer(spotifyEntry);

const imageGenEntry = createImageGenServer();
registerMcpServer(imageGenEntry);

const soundchartsEntry = createSoundchartsServer();
registerMcpServer(soundchartsEntry);

const googleCalendarEntry = createGoogleCalendarServer(app);
registerMcpServer(googleCalendarEntry);

// n8n: async initialization (non-blocking — server starts while n8n-mcp subprocess warms up)
createN8nServer()
  .then((n8nEntry) => {
    registerMcpServer(n8nEntry);
    logger.info("[n8n] Server registered in hub");
  })
  .catch((err) => {
    logger.warn("[n8n] Could not initialize n8n server:", err);
  });

setupFallbackRoutes();

app.listen(config.port, () => {
  logger.info("================================================");
  logger.info("  Dancing Dead Records - MCP Server");
  logger.info(`  Environment : ${config.nodeEnv}`);
  logger.info(`  Port        : ${config.port}`);
  logger.info(`  Health      : /health`);
  logger.info(`  MCP list    : /api/mcp/list`);
  logger.info(`  Ping        : /ping/mcp`);
  logger.info(`  Spotify     : /spotify/mcp`);
  logger.info(`  Image-gen   : /image-gen/mcp`);
  logger.info(`  Soundcharts : /soundcharts/mcp`);
  logger.info(`  Google Cal  : /google-calendar/mcp`);
  logger.info(`  n8n         : /n8n/mcp`);
  logger.info("================================================");
});

export { app };
