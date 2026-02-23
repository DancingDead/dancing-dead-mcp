import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../../config.js";

// ── Types ────────────────────────────────────────────

export interface GoogleCalendarAccount {
    displayName: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;       // timestamp in milliseconds
    scopes: string;
    addedAt: string;         // ISO date
}

export interface GoogleCalendarAccountStore {
    [accountName: string]: GoogleCalendarAccount;
}

// ── File path ────────────────────────────────────────

// Get the project root directory (3 levels up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..", "..", "..");

const DATA_DIR = join(PROJECT_ROOT, "data");
const STORE_PATH = join(DATA_DIR, "google-calendar-accounts.json");
const STORE_TMP = STORE_PATH + ".tmp";

// ── Functions ────────────────────────────────────────

export async function loadStore(): Promise<GoogleCalendarAccountStore> {
    try {
        const raw = await readFile(STORE_PATH, "utf-8");
        return JSON.parse(raw) as GoogleCalendarAccountStore;
    } catch (err: unknown) {
        const error = err as NodeJS.ErrnoException;
        if (error.code === "ENOENT") {
            return {};
        }
        logger.warn("Failed to parse google-calendar store, starting fresh");
        return {};
    }
}

export async function saveStore(store: GoogleCalendarAccountStore): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(STORE_TMP, JSON.stringify(store, null, 2), "utf-8");
    await rename(STORE_TMP, STORE_PATH);
}

export async function getAccount(name: string): Promise<GoogleCalendarAccount | undefined> {
    const store = await loadStore();
    return store[name];
}

export async function setAccount(name: string, account: GoogleCalendarAccount): Promise<void> {
    const store = await loadStore();
    store[name] = account;
    await saveStore(store);
}

export async function removeAccount(name: string): Promise<void> {
    const store = await loadStore();
    delete store[name];
    await saveStore(store);
}

export async function listAccounts(): Promise<string[]> {
    const store = await loadStore();
    return Object.keys(store);
}

export async function resolveAccountName(requested: string | undefined): Promise<string> {
    const store = await loadStore();
    const names = Object.keys(store);

    if (names.length === 0) {
        throw new Error("No Google Calendar accounts connected. Use google-calendar-auth to connect one.");
    }

    if (requested) {
        if (!store[requested]) {
            throw new Error(
                `Account "${requested}" not found. Available: ${names.join(", ")}`
            );
        }
        return requested;
    }

    if (names.length === 1) {
        return names[0];
    }

    throw new Error(
        `Multiple accounts connected. Specify which one: ${names.join(", ")}`
    );
}