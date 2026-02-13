import { ensureValidToken } from "./auth.js";
import { logger } from "../../config.js";

// ── Base URL ─────────────────────────────────────────

const SPOTIFY_API = "https://api.spotify.com/v1";

// ── Requête interne ──────────────────────────────────

async function spotifyRequest<T>(
    accountName: string,
    method: string,
    path: string,
    options?: {
        body?: unknown;
        params?: Record<string, string>;
        contentType?: string;
    }
): Promise<T> {
    const token = await ensureValidToken(accountName);

    // Construire l'URL avec les query params
    let url = `${SPOTIFY_API}${path}`;
    if (options?.params) {
        const search = new URLSearchParams(options.params);
        url += `?${search.toString()}`;
    }

    // Headers
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };

    // Body
    let bodyStr: string | undefined;
    if (options?.contentType === "image/jpeg") {
        headers["Content-Type"] = "image/jpeg";
        bodyStr = options.body as string;
    } else if (options?.body !== undefined) {
        headers["Content-Type"] = "application/json";
        bodyStr = JSON.stringify(options.body);
    }

    // Faire la requête
    const response = await fetch(url, { method, headers, body: bodyStr });

    // Gérer le rate limiting (429)
    if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
        logger.warn(`Spotify rate limited, waiting ${retryAfter}s`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return spotifyRequest(accountName, method, path, options);
    }

    // 204 = No Content (success sans body)
    if (response.status === 204) {
        return undefined as T;
    }

    // Check if response has content before parsing JSON
    const contentLength = response.headers.get("Content-Length");
    const contentType = response.headers.get("Content-Type");

    // If Content-Length is 0 or Content-Type is not JSON, return undefined
    if (contentLength === "0" || !contentType?.includes("application/json")) {
        if (!response.ok) {
            throw new Error(`Spotify API ${response.status}: ${response.statusText}`);
        }
        return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
        const msg = (data as { error?: { message?: string } })?.error?.message
            || response.statusText;
        throw new Error(`Spotify API ${response.status}: ${msg}`);
    }

    return data as T;
}

// ── Fonctions publiques ──────────────────────────────

export async function spotifyGet<T>(
    account: string,
    path: string,
    params?: Record<string, string>
): Promise<T> {
    return spotifyRequest<T>(account, "GET", path, { params });
}

export async function spotifyPost<T>(
    account: string,
    path: string,
    body?: unknown
): Promise<T> {
    return spotifyRequest<T>(account, "POST", path, { body });
}

export async function spotifyPut<T>(
    account: string,
    path: string,
    body?: unknown
): Promise<T> {
    return spotifyRequest<T>(account, "PUT", path, { body });
}

export async function spotifyDelete<T>(
    account: string,
    path: string,
    body?: unknown
): Promise<T> {
    return spotifyRequest<T>(account, "DELETE", path, { body });
}

export async function spotifyPutImage(
    account: string,
    path: string,
    base64Image: string
): Promise<void> {
    await spotifyRequest<void>(account, "PUT", path, {
        body: base64Image,
        contentType: "image/jpeg",
    });
}

export function formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}
