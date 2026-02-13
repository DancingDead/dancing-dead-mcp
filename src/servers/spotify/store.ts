import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../../config.js";

// ── Types ────────────────────────────────────────────

export interface SpotifyAccount {
    displayName: string;
    spotifyUserId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;       // timestamp en millisecondes
    scopes: string;
    addedAt: string;         // date ISO
}

export interface SpotifyAccountStore {
    [accountName: string]: SpotifyAccount;
}

// ── Chemin du fichier ────────────────────────────────

// Get the project root directory (3 levels up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..", "..", "..");

const DATA_DIR = join(PROJECT_ROOT, "data");
const STORE_PATH = join(DATA_DIR, "spotify-accounts.json");
const STORE_TMP = STORE_PATH + ".tmp";

// ── Fonctions ────────────────────────────────────────

export async function loadStore(): Promise<SpotifyAccountStore> {
    try {
        const raw = await readFile(STORE_PATH, "utf-8");
        return JSON.parse(raw) as SpotifyAccountStore;
    } catch (err: unknown) {
        const error = err as NodeJS.ErrnoException;
        if (error.code === "ENOENT") {
            return {};
        }
        logger.warn("Failed to parse spotify store, starting fresh");
        return {};
    }
}

export async function saveStore(store: SpotifyAccountStore): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(STORE_TMP, JSON.stringify(store, null, 2), "utf-8");
    await rename(STORE_TMP, STORE_PATH);
}

export async function getAccount(name: string): Promise<SpotifyAccount | undefined> {
    const store = await loadStore();
    return store[name];
}

export async function setAccount(name: string, account: SpotifyAccount): Promise<void> {
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
        throw new Error("No Spotify accounts connected. Use spotify-auth to connect one.");
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
