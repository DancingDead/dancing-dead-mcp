/**
 * Spotify ACL — Per-user access control via in-band session identification.
 *
 * Users call the `spotify-identify` tool with just their username to unlock
 * permissions for the current MCP session. Without identification, sessions
 * default to the "viewer" (read-only) role.
 */

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../../config.js";

import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerRequest, ServerNotification, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// ── Types ────────────────────────────────────────────

export type SpotifyRole = "admin" | "editor" | "viewer";

interface AclUser {
    displayName: string;
    role: SpotifyRole;
}

interface AclConfig {
    users: Record<string, AclUser>;
    defaultRole: SpotifyRole;
}

interface SessionInfo {
    username: string;
    displayName: string;
    role: SpotifyRole;
    identifiedAt: number;
}

// ── Constants ────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const DATA_DIR = resolve(dirname(__filename), "..", "..", "..", "data");
const ACL_PATH = resolve(DATA_DIR, "spotify-acl.json");

const ROLE_HIERARCHY: Record<SpotifyRole, number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
};

/**
 * Minimum role required to call each tool.
 * Tools not listed here default to "viewer" (open access).
 */
const TOOL_MIN_ROLE: Record<string, SpotifyRole> = {
    // Admin-only
    "spotify-auth": "admin",
    "spotify-remove-account": "admin",
    "spotify-play": "admin",
    "spotify-pause": "admin",
    "spotify-next": "admin",
    "spotify-previous": "admin",
    "spotify-set-volume": "admin",
    "spotify-add-to-queue": "admin",
    // Editor
    "spotify-create-playlist": "editor",
    "spotify-update-playlist": "editor",
    "spotify-add-to-playlist": "editor",
    "spotify-remove-from-playlist": "editor",
    "spotify-reorder-playlist": "editor",
    "spotify-update-playlist-cover": "editor",
    "spotify-save-tracks": "editor",
    "spotify-remove-saved-tracks": "editor",
};

// ── ACL Config loader (cached with TTL) ─────────────

let cachedConfig: AclConfig | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000; // 60 s

async function loadAclConfig(): Promise<AclConfig | null> {
    const now = Date.now();
    if (cachedConfig && now - cacheLoadedAt < CACHE_TTL_MS) {
        return cachedConfig;
    }
    try {
        const raw = await readFile(ACL_PATH, "utf-8");
        cachedConfig = JSON.parse(raw) as AclConfig;
        cacheLoadedAt = now;
        return cachedConfig;
    } catch {
        if (!cachedConfig) {
            logger.warn("[ACL] spotify-acl.json not found — everyone is viewer");
        }
        return cachedConfig; // may still be null on first failure
    }
}

// ── Session store (in-memory) ───────────────────────

const sessions = new Map<string, SessionInfo>();

// ── Public API ──────────────────────────────────────

export function getRequiredRole(toolName: string): SpotifyRole {
    return TOOL_MIN_ROLE[toolName] ?? "viewer";
}

/**
 * Return the list of known usernames from the ACL config.
 * Used to populate tool descriptions so Claude can auto-identify.
 */
export async function listKnownUsers(): Promise<string[]> {
    const config = await loadAclConfig();
    if (!config) return [];
    return Object.keys(config.users);
}

/**
 * Identify a session by username.
 * Returns `{ success, role?, error? }`.
 */
export async function identifySession(
    sessionId: string,
    username: string,
): Promise<{ success: boolean; role?: SpotifyRole; error?: string }> {
    const config = await loadAclConfig();
    if (!config) {
        return { success: false, error: "ACL configuration file not found (data/spotify-acl.json)." };
    }

    const user = config.users[username];
    if (!user) {
        logger.warn(`[ACL] Failed identify: unknown user "${username}" (session ${sessionId.slice(0, 8)}...)`);
        return { success: false, error: `Unknown username "${username}".` };
    }

    sessions.set(sessionId, {
        username,
        displayName: user.displayName,
        role: user.role,
        identifiedAt: Date.now(),
    });

    logger.info(`[ACL] Session ${sessionId.slice(0, 8)}... identified as "${username}" (${user.role})`);
    return { success: true, role: user.role };
}

/** Get current session info (or undefined if unidentified). */
export function getSessionInfo(sessionId: string | undefined): SessionInfo | undefined {
    if (!sessionId) return undefined;
    return sessions.get(sessionId);
}

/**
 * Check if a session has permission for a given tool.
 */
export async function checkPermission(
    sessionId: string | undefined,
    toolName: string,
): Promise<{ allowed: boolean; role: SpotifyRole; reason?: string }> {
    const requiredRole = getRequiredRole(toolName);

    // Viewer tools are always allowed
    if (requiredRole === "viewer") {
        return { allowed: true, role: "viewer" };
    }

    // No session (e.g. stdio mode) → admin by default
    if (!sessionId) {
        return { allowed: true, role: "admin" };
    }

    const session = sessions.get(sessionId);
    const currentRole: SpotifyRole = session?.role ?? "viewer";
    const allowed = ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];

    if (!allowed) {
        logger.warn(
            `[ACL] Denied: session ${sessionId.slice(0, 8)}... (${currentRole}) → "${toolName}" (needs ${requiredRole})`,
        );
    }

    return {
        allowed,
        role: currentRole,
        reason: allowed
            ? undefined
            : `Requires "${requiredRole}" role. Use spotify-identify to authenticate.`,
    };
}

// ── withAcl wrapper ─────────────────────────────────

type Extra = RequestHandlerExtra<ServerRequest, ServerNotification>;

/**
 * Higher-order function that wraps a tool handler with ACL checking.
 * If the session lacks permission, returns an error result instead of calling the handler.
 */
export function withAcl<Args>(
    toolName: string,
    handler: (args: Args, extra: Extra) => Promise<CallToolResult>,
): (args: Args, extra: Extra) => Promise<CallToolResult> {
    return async (args: Args, extra: Extra): Promise<CallToolResult> => {
        const { allowed, role, reason } = await checkPermission(extra.sessionId, toolName);

        if (!allowed) {
            const requiredRole = getRequiredRole(toolName);
            return {
                content: [
                    {
                        type: "text" as const,
                        text:
                            `Access denied: "${toolName}" requires "${requiredRole}" role. ` +
                            `Your current role: "${role}".\n\n` +
                            `You must call "spotify-identify" first to authenticate this session. ` +
                            `Infer the user's first name from the conversation context and call ` +
                            `spotify-identify automatically. If you cannot determine the name, ` +
                            `call spotify-identify with username "unknown" to get the list of valid names.`,
                    },
                ],
                isError: true,
            };
        }

        return handler(args, extra);
    };
}
