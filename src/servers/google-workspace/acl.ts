/**
 * Google Workspace ACL — Per-user access control.
 *
 * Two authentication methods:
 *
 * 1. API key (HTTP level): user passes ?key=abc123 in the MCP URL.
 *    The server validates at session creation and binds permissions.
 *
 * 2. In-band identification: user calls `google-workspace-identify`
 *    with their username. Claude infers the name from context.
 *    This is the primary method for Claude Team (shared connector).
 *
 * Both methods bind allowedAccounts to the MCP sessionId.
 * Without identification, sessions have unrestricted access (backward compat).
 */

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../../config.js";
import { loadStore } from "./store.js";

// ── Types ────────────────────────────────────────────

interface ApiKeyEntry {
    user: string;
    displayName: string;
    allowedAccounts: string[];
}

interface KeysConfig {
    keys: Record<string, ApiKeyEntry>;
}

interface SessionPermissions {
    user: string;
    displayName: string;
    allowedAccounts: string[];
    authenticatedAt: number;
}

export type ApiKeyValidation = {
    valid: true;
    user: string;
    displayName: string;
    allowedAccounts: string[];
} | {
    valid: false;
};

// ── Constants ────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const DATA_DIR = resolve(dirname(__filename), "..", "..", "..", "data");
const KEYS_PATH = resolve(DATA_DIR, "google-workspace-keys.json");

// ── Keys Config loader (cached with TTL) ─────────────

let cachedConfig: KeysConfig | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000; // 60 s

async function loadKeysConfig(): Promise<KeysConfig | null> {
    const now = Date.now();
    if (cachedConfig && now - cacheLoadedAt < CACHE_TTL_MS) {
        return cachedConfig;
    }
    try {
        const raw = await readFile(KEYS_PATH, "utf-8");
        cachedConfig = JSON.parse(raw) as KeysConfig;
        cacheLoadedAt = now;
        return cachedConfig;
    } catch {
        if (!cachedConfig) {
            logger.warn("[GW-ACL] google-workspace-keys.json not found — API key auth disabled");
        }
        return cachedConfig; // may still be null on first failure
    }
}

// ── Session store (in-memory) ───────────────────────

const sessions = new Map<string, SessionPermissions>();

// ── Public API ──────────────────────────────────────

/**
 * Validate an API key against the keys config.
 */
export async function validateApiKey(key: string): Promise<ApiKeyValidation> {
    const config = await loadKeysConfig();
    if (!config) {
        return { valid: false };
    }

    const entry = config.keys[key];
    if (!entry) {
        logger.warn(`[GW-ACL] Invalid API key attempted: ${key.slice(0, 8)}...`);
        return { valid: false };
    }

    return {
        valid: true,
        user: entry.user,
        displayName: entry.displayName,
        allowedAccounts: entry.allowedAccounts,
    };
}

/**
 * Store permissions for an MCP session after successful API key validation.
 */
export function setSessionPermissions(
    sessionId: string,
    allowedAccounts: string[],
    user: string,
    displayName: string,
): void {
    sessions.set(sessionId, {
        user,
        displayName,
        allowedAccounts,
        authenticatedAt: Date.now(),
    });
    logger.info(`[GW-ACL] Session ${sessionId.slice(0, 8)}... authenticated as "${user}" — accounts: [${allowedAccounts.join(", ")}]`);
}

/**
 * Get session permissions (or undefined if no API key was used).
 */
export function getSessionPermissions(sessionId: string | undefined): SessionPermissions | undefined {
    if (!sessionId) return undefined;
    return sessions.get(sessionId);
}

/**
 * Clean up session permissions when a session closes.
 */
export function clearSessionPermissions(sessionId: string): void {
    sessions.delete(sessionId);
}

/**
 * Resolve and validate an account name, applying ACL restrictions.
 *
 * Behavior:
 * 1. No sessionId (stdio mode) → no restriction, standard resolution
 * 2. SessionId without permissions (no API key used) → no restriction
 * 3. SessionId with permissions → filter by allowedAccounts
 */
export async function resolveAccountWithAcl(
    sessionId: string | undefined,
    requestedAccount: string | undefined,
): Promise<string> {
    const store = await loadStore();
    const allNames = Object.keys(store);

    if (allNames.length === 0) {
        throw new Error("No Google Workspace accounts connected. Use google-workspace-auth to connect one.");
    }

    // Get permissions for this session
    const permissions = getSessionPermissions(sessionId);

    // No session or no permissions → standard behavior (no restriction)
    if (!permissions) {
        if (requestedAccount) {
            if (!store[requestedAccount]) {
                throw new Error(`Account "${requestedAccount}" not found. Available: ${allNames.join(", ")}`);
            }
            return requestedAccount;
        }
        if (allNames.length === 1) {
            return allNames[0];
        }
        throw new Error(`Multiple accounts connected. Specify which one: ${allNames.join(", ")}`);
    }

    // Session has permissions — filter by allowedAccounts
    const allowed = permissions.allowedAccounts.filter((a) => store[a]);

    if (allowed.length === 0) {
        throw new Error(
            `No authorized accounts available for user "${permissions.user}". ` +
            `Allowed: [${permissions.allowedAccounts.join(", ")}], but none are connected.`
        );
    }

    if (requestedAccount) {
        if (!permissions.allowedAccounts.includes(requestedAccount)) {
            logger.warn(`[GW-ACL] Access denied: user "${permissions.user}" tried to access account "${requestedAccount}"`);
            throw new Error(
                `Access denied: account "${requestedAccount}" is not authorized for user "${permissions.user}". ` +
                `Authorized accounts: ${allowed.join(", ")}`
            );
        }
        if (!store[requestedAccount]) {
            throw new Error(`Account "${requestedAccount}" not found. Available authorized accounts: ${allowed.join(", ")}`);
        }
        return requestedAccount;
    }

    // No specific account requested — auto-select
    if (allowed.length === 1) {
        return allowed[0];
    }

    throw new Error(`Multiple authorized accounts available. Specify which one: ${allowed.join(", ")}`);
}

/**
 * List accounts visible to the current session.
 */
export async function listAccountsWithAcl(sessionId: string | undefined): Promise<string[]> {
    const store = await loadStore();
    const allNames = Object.keys(store);

    const permissions = getSessionPermissions(sessionId);
    if (!permissions) {
        return allNames;
    }

    return allNames.filter((name) => permissions.allowedAccounts.includes(name));
}

// ── In-band identification ──────────────────────────

/**
 * Return the list of known usernames from the keys config.
 * Used by google-workspace-identify so Claude can auto-identify.
 */
export async function listKnownUsers(): Promise<string[]> {
    const config = await loadKeysConfig();
    if (!config) return [];
    // Collect unique usernames from all key entries
    const users = new Set<string>();
    for (const entry of Object.values(config.keys)) {
        users.add(entry.user);
    }
    return [...users];
}

/**
 * Identify a session by username (in-band, without API key).
 * Looks up the username in keys config and binds allowedAccounts to the session.
 */
export async function identifySession(
    sessionId: string,
    username: string,
): Promise<{ success: boolean; displayName?: string; allowedAccounts?: string[]; error?: string }> {
    const config = await loadKeysConfig();
    if (!config) {
        return { success: false, error: "ACL configuration file not found (data/google-workspace-keys.json)." };
    }

    // Find the first key entry matching this username
    const entry = Object.values(config.keys).find((e) => e.user === username);
    if (!entry) {
        logger.warn(`[GW-ACL] Failed identify: unknown user "${username}" (session ${sessionId.slice(0, 8)}...)`);
        return { success: false, error: `Unknown username "${username}".` };
    }

    setSessionPermissions(sessionId, entry.allowedAccounts, entry.user, entry.displayName);
    return {
        success: true,
        displayName: entry.displayName,
        allowedAccounts: entry.allowedAccounts,
    };
}
