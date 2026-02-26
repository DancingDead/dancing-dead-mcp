import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveAccountName, loadStore, removeAccount } from "./store.js";
import { generateAuthUrl } from "./auth.js";
import {
    spotifyGet,
    spotifyPost,
    spotifyPut,
    spotifyDelete,
    spotifyPutImage,
    formatError,
} from "./api.js";
import { withAcl, identifySession, getSessionInfo, listKnownUsers } from "./acl.js";

// ── Utilitaire ───────────────────────────────────────

function extractSpotifyId(input: string): string {
    if (input.startsWith("spotify:")) {
        return input.split(":").pop()!;
    }
    if (input.startsWith("http")) {
        const url = new URL(input);
        const parts = url.pathname.split("/");
        return parts[parts.length - 1];
    }
    return input;
}

// Le paramètre "account" réutilisé partout
const accountParam = z.string().optional().describe(
    "Account name (e.g. 'dancing-dead'). Omit if only one account is connected."
);

// ── Enregistrement de tous les tools ─────────────────

export function registerSpotifyTools(mcpServer: McpServer): void {

    // ═══════════════════════════════════════════════════
    // ACCOUNT MANAGEMENT
    // ═══════════════════════════════════════════════════

    mcpServer.tool(
        "spotify-auth",
        "Generate an authorization URL to connect a Spotify account (requires admin role)",
        { account_name: z.string().describe("Friendly name, e.g. 'dancing-dead', 'den-haku'") },
        withAcl("spotify-auth", async ({ account_name }, _extra) => {
            try {
                // Start temporary OAuth server for stdio mode
                const { startTemporaryOAuthServer } = await import("./oauth-server.js");
                const serverInfo = await startTemporaryOAuthServer();

                const url = generateAuthUrl(account_name);
                return {
                    content: [{
                        type: "text" as const,
                        text: `🎵 Spotify OAuth Authentication\n\n` +
                            `✅ OAuth server ready on port ${serverInfo.port}\n\n` +
                            `📋 Instructions:\n` +
                            `1. Open this URL in your browser:\n   ${url}\n\n` +
                            `2. Log in to Spotify and authorize the application\n\n` +
                            `3. You'll be redirected to http://127.0.0.1:${serverInfo.port}/spotify/callback\n\n` +
                            `4. Look for "✅ Account connected!" message\n\n` +
                            `⚠️  IMPORTANT: Don't wait too long! The authorization code expires after a few minutes.\n\n` +
                            `Account name: "${account_name}"\n` +
                            `Redirect URI: ${serverInfo.url}`,
                    }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-accounts",
        "List all connected Spotify accounts",
        {},
        async () => {
            const store = await loadStore();
            const names = Object.keys(store);
            if (names.length === 0) {
                return {
                    content: [{ type: "text" as const, text: "No Spotify accounts connected. Use spotify-auth to connect one." }],
                };
            }
            const list = names.map((name) => {
                const acc = store[name];
                return `- ${name}: ${acc.displayName} (${acc.spotifyUserId})`;
            });
            return {
                content: [{ type: "text" as const, text: `Connected accounts:\n${list.join("\n")}` }],
            };
        }
    );

    mcpServer.tool(
        "spotify-remove-account",
        "Disconnect a Spotify account (requires admin role)",
        { account_name: z.string().describe("Name of the account to remove") },
        withAcl("spotify-remove-account", async ({ account_name }, _extra) => {
            try {
                await removeAccount(account_name);
                return {
                    content: [{ type: "text" as const, text: `Account "${account_name}" removed.` }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-whoami",
        "Get the Spotify profile of an account",
        { account: accountParam },
        async ({ account }) => {
            try {
                const name = await resolveAccountName(account);
                const profile = await spotifyGet(name, "/me");
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(profile, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    // ═══════════════════════════════════════════════════
    // SESSION IDENTIFICATION (ACL)
    // ═══════════════════════════════════════════════════

    mcpServer.tool(
        "spotify-identify",
        "IMPORTANT: You MUST call this tool AUTOMATICALLY at the very start of the session, " +
        "BEFORE calling any other Spotify tool. Do NOT ask the user for their name — " +
        "infer it from the conversation context (the user's first name, how they sign messages, " +
        "or any contextual clue). If you cannot determine the name, call this tool with " +
        "username 'unknown' to get the list of valid usernames, then ask the user to pick one. " +
        "This is required to unlock permissions beyond read-only access.",
        {
            username: z.string().describe(
                "The user's first name in lowercase (e.g. 'theo', 'alex'). " +
                "Infer from conversation context. Use 'unknown' to get the list of valid usernames."
            ),
        },
        async ({ username }, extra) => {
            const sessionId = extra.sessionId;
            if (!sessionId) {
                return {
                    content: [{
                        type: "text" as const,
                        text: "Identification skipped: no session ID (stdio mode — you already have admin access).",
                    }],
                };
            }

            // If username is 'unknown', return the list of known users
            if (username === "unknown") {
                const knownUsers = await listKnownUsers();
                if (knownUsers.length === 0) {
                    return {
                        content: [{
                            type: "text" as const,
                            text: "No ACL configuration found. Everyone has viewer (read-only) access.",
                        }],
                    };
                }
                return {
                    content: [{
                        type: "text" as const,
                        text: `Please identify yourself. Known usernames: ${knownUsers.join(", ")}.\n` +
                              `Call spotify-identify again with your username.`,
                    }],
                };
            }

            const result = await identifySession(sessionId, username);

            if (result.success) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Identified as "${username}" with role: ${result.role}.\n` +
                              `You now have ${result.role} permissions for this session.`,
                    }],
                };
            }

            // On failure, suggest valid usernames
            const knownUsers = await listKnownUsers();
            return {
                content: [{
                    type: "text" as const,
                    text: `Identification failed: ${result.error}\n` +
                          `Valid usernames: ${knownUsers.join(", ")}.\n` +
                          `Ask the user which name to use, then call spotify-identify again.`,
                }],
                isError: true,
            };
        },
    );

    mcpServer.tool(
        "spotify-session-info",
        "Check your current session identity and permission level",
        {},
        async (_args, extra) => {
            const sessionId = extra.sessionId;
            if (!sessionId) {
                return {
                    content: [{
                        type: "text" as const,
                        text: "Mode: stdio (local) — admin access by default.",
                    }],
                };
            }

            const info = getSessionInfo(sessionId);
            if (!info) {
                return {
                    content: [{
                        type: "text" as const,
                        text: "Not identified. Current role: viewer (read-only).\n" +
                              "Use spotify-identify to authenticate and unlock more permissions.",
                    }],
                };
            }

            return {
                content: [{
                    type: "text" as const,
                    text: `Session identified as: ${info.displayName} (${info.username})\n` +
                          `Role: ${info.role}\n` +
                          `Identified at: ${new Date(info.identifiedAt).toISOString()}`,
                }],
            };
        },
    );

    // ═══════════════════════════════════════════════════
    // SEARCH
    // ═══════════════════════════════════════════════════

    mcpServer.tool(
        "spotify-search",
        "Search Spotify for tracks, albums, artists, or playlists",
        {
            query: z.string().describe("Search query"),
            type: z.enum(["track", "album", "artist", "playlist"]).default("track"),
            limit: z.number().min(1).max(50).default(20).optional(),
            account: accountParam,
        },
        async ({ query, type, limit, account }) => {
            try {
                const name = await resolveAccountName(account);
                const results = await spotifyGet(name, "/search", {
                    q: query,
                    type,
                    limit: String(limit || 20),
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    // ═══════════════════════════════════════════════════
    // METADATA
    // ═══════════════════════════════════════════════════

    mcpServer.tool(
        "spotify-get-track",
        "Get details about a Spotify track",
        {
            track_id: z.string().describe("Spotify track ID or URI"),
            account: accountParam,
        },
        async ({ track_id, account }) => {
            try {
                const name = await resolveAccountName(account);
                const id = extractSpotifyId(track_id);
                const track = await spotifyGet(name, `/tracks/${id}`);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(track, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-get-album",
        "Get details about a Spotify album",
        {
            album_id: z.string().describe("Spotify album ID or URI"),
            account: accountParam,
        },
        async ({ album_id, account }) => {
            try {
                const name = await resolveAccountName(account);
                const id = extractSpotifyId(album_id);
                const album = await spotifyGet(name, `/albums/${id}`);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(album, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-get-album-tracks",
        "Get the tracks of a Spotify album",
        {
            album_id: z.string(),
            limit: z.number().min(1).max(50).default(50).optional(),
            offset: z.number().default(0).optional(),
            account: accountParam,
        },
        async ({ album_id, limit, offset, account }) => {
            try {
                const name = await resolveAccountName(account);
                const id = extractSpotifyId(album_id);
                const tracks = await spotifyGet(name, `/albums/${id}/tracks`, {
                    limit: String(limit || 50),
                    offset: String(offset || 0),
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(tracks, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-get-artist",
        "Get details about a Spotify artist",
        {
            artist_id: z.string().describe("Spotify artist ID or URI"),
            account: accountParam,
        },
        async ({ artist_id, account }) => {
            try {
                const name = await resolveAccountName(account);
                const id = extractSpotifyId(artist_id);
                const artist = await spotifyGet(name, `/artists/${id}`);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(artist, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-get-artist-albums",
        "Get the albums of a Spotify artist",
        {
            artist_id: z.string(),
            include_groups: z.string().optional().describe("album, single, appears_on, compilation"),
            limit: z.number().min(1).max(50).default(20).optional(),
            offset: z.number().default(0).optional(),
            account: accountParam,
        },
        async ({ artist_id, include_groups, limit, offset, account }) => {
            try {
                const name = await resolveAccountName(account);
                const id = extractSpotifyId(artist_id);
                const params: Record<string, string> = {
                    limit: String(limit || 20),
                    offset: String(offset || 0),
                };
                if (include_groups) params.include_groups = include_groups;
                const albums = await spotifyGet(name, `/artists/${id}/albums`, params);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(albums, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    // ═══════════════════════════════════════════════════
    // PLAYLISTS
    // ═══════════════════════════════════════════════════

    mcpServer.tool(
        "spotify-list-playlists",
        "Get the current user's playlists",
        {
            limit: z.number().min(1).max(50).default(20).optional(),
            offset: z.number().default(0).optional(),
            account: accountParam,
        },
        async ({ limit, offset, account }) => {
            try {
                const name = await resolveAccountName(account);
                const playlists = await spotifyGet(name, "/me/playlists", {
                    limit: String(limit || 20),
                    offset: String(offset || 0),
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(playlists, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-get-playlist-items",
        "Get the tracks in a playlist",
        {
            playlist_id: z.string(),
            limit: z.number().min(1).max(100).default(100).optional(),
            offset: z.number().default(0).optional(),
            account: accountParam,
        },
        async ({ playlist_id, limit, offset, account }) => {
            try {
                const name = await resolveAccountName(account);
                const id = extractSpotifyId(playlist_id);
                const items = await spotifyGet(name, `/playlists/${id}/items`, {
                    limit: String(limit || 100),
                    offset: String(offset || 0),
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-create-playlist",
        "Create a new playlist (requires editor role)",
        {
            name: z.string().describe("Playlist name"),
            description: z.string().optional(),
            public: z.boolean().default(false).optional(),
            collaborative: z.boolean().default(false).optional(),
            account: accountParam,
        },
        withAcl("spotify-create-playlist", async ({ name: playlistName, description, public: isPublic, collaborative, account }, _extra) => {
            try {
                const accName = await resolveAccountName(account);
                const profile = await spotifyGet<{ id: string }>(accName, "/me");
                const playlist = await spotifyPost(accName, `/users/${profile.id}/playlists`, {
                    name: playlistName,
                    description: description || "",
                    public: isPublic ?? false,
                    collaborative: collaborative ?? false,
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(playlist, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-update-playlist",
        "Change a playlist's name, description, or visibility (requires editor role)",
        {
            playlist_id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            public: z.boolean().optional(),
            account: accountParam,
        },
        withAcl("spotify-update-playlist", async ({ playlist_id, name: newName, description, public: isPublic, account }, _extra) => {
            try {
                const accName = await resolveAccountName(account);
                const id = extractSpotifyId(playlist_id);
                const body: Record<string, unknown> = {};
                if (newName !== undefined) body.name = newName;
                if (description !== undefined) body.description = description;
                if (isPublic !== undefined) body.public = isPublic;
                await spotifyPut(accName, `/playlists/${id}`, body);
                return {
                    content: [{ type: "text" as const, text: "Playlist updated." }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-add-to-playlist",
        "Add tracks to a playlist (requires editor role)",
        {
            playlist_id: z.string(),
            uris: z.array(z.string()).describe("Array of Spotify track URIs (spotify:track:xxx)"),
            position: z.number().optional().describe("Position to insert at (0-indexed). Omit to append."),
            account: accountParam,
        },
        withAcl("spotify-add-to-playlist", async ({ playlist_id, uris, position, account }, _extra) => {
            try {
                const accName = await resolveAccountName(account);
                const id = extractSpotifyId(playlist_id);
                const body: Record<string, unknown> = { uris };
                if (position !== undefined) body.position = position;
                const result = await spotifyPost(accName, `/playlists/${id}/items`, body);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-remove-from-playlist",
        "Remove tracks from a playlist (requires editor role)",
        {
            playlist_id: z.string(),
            uris: z.array(z.string()).describe("Array of Spotify track URIs to remove"),
            account: accountParam,
        },
        withAcl("spotify-remove-from-playlist", async ({ playlist_id, uris, account }, _extra) => {
            try {
                const accName = await resolveAccountName(account);
                const id = extractSpotifyId(playlist_id);
                const result = await spotifyDelete(accName, `/playlists/${id}/items`, {
                    items: uris.map((uri) => ({ uri })),
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-reorder-playlist",
        "Reorder tracks within a playlist (requires editor role)",
        {
            playlist_id: z.string(),
            range_start: z.number().describe("Position of the first item to move"),
            range_length: z.number().default(1).optional(),
            insert_before: z.number().describe("Position to insert before"),
            account: accountParam,
        },
        withAcl("spotify-reorder-playlist", async ({ playlist_id, range_start, range_length, insert_before, account }, _extra) => {
            try {
                const accName = await resolveAccountName(account);
                const id = extractSpotifyId(playlist_id);
                const result = await spotifyPut(accName, `/playlists/${id}/items`, {
                    range_start,
                    range_length: range_length || 1,
                    insert_before,
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-update-playlist-cover",
        "Upload a custom cover image for a playlist (requires editor role)",
        {
            playlist_id: z.string(),
            image_base64: z.string().describe("Base64-encoded JPEG image"),
            account: accountParam,
        },
        withAcl("spotify-update-playlist-cover", async ({ playlist_id, image_base64, account }, _extra) => {
            try {
                const accName = await resolveAccountName(account);
                const id = extractSpotifyId(playlist_id);
                await spotifyPutImage(accName, `/playlists/${id}/images`, image_base64);
                return {
                    content: [{ type: "text" as const, text: "Playlist cover updated." }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    // ═══════════════════════════════════════════════════
    // PLAYBACK
    // ═══════════════════════════════════════════════════

    mcpServer.tool(
        "spotify-now-playing",
        "Get the currently playing track",
        { account: accountParam },
        async ({ account }) => {
            try {
                const name = await resolveAccountName(account);
                const data = await spotifyGet(name, "/me/player/currently-playing");
                if (!data) {
                    return { content: [{ type: "text" as const, text: "Nothing is currently playing." }] };
                }
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-playback-state",
        "Get full playback state including device info",
        { account: accountParam },
        async ({ account }) => {
            try {
                const name = await resolveAccountName(account);
                const data = await spotifyGet(name, "/me/player");
                if (!data) {
                    return { content: [{ type: "text" as const, text: "No active playback." }] };
                }
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-play",
        "Start or resume playback (requires admin role)",
        {
            context_uri: z.string().optional().describe("URI of context to play (album, playlist, artist)"),
            uris: z.array(z.string()).optional().describe("Array of track URIs to play"),
            offset: z.number().optional().describe("Position in context to start at"),
            device_id: z.string().optional(),
            account: accountParam,
        },
        withAcl("spotify-play", async ({ context_uri, uris, offset, device_id, account }, _extra) => {
            try {
                const name = await resolveAccountName(account);
                const body: Record<string, unknown> = {};
                if (context_uri) body.context_uri = context_uri;
                if (uris) body.uris = uris;
                if (offset !== undefined) body.offset = { position: offset };
                const params: Record<string, string> = {};
                if (device_id) params.device_id = device_id;
                const url = Object.keys(params).length
                    ? `/me/player/play?${new URLSearchParams(params).toString()}`
                    : "/me/player/play";
                await spotifyPut(name, url);
                return { content: [{ type: "text" as const, text: "Playback started." }] };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-pause",
        "Pause playback (requires admin role)",
        { device_id: z.string().optional(), account: accountParam },
        withAcl("spotify-pause", async ({ device_id, account }, _extra) => {
            try {
                const name = await resolveAccountName(account);
                const params = device_id ? `?device_id=${device_id}` : "";
                await spotifyPut(name, `/me/player/pause${params}`);
                return { content: [{ type: "text" as const, text: "Playback paused." }] };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-next",
        "Skip to next track (requires admin role)",
        { device_id: z.string().optional(), account: accountParam },
        withAcl("spotify-next", async ({ device_id, account }, _extra) => {
            try {
                const name = await resolveAccountName(account);
                const params = device_id ? `?device_id=${device_id}` : "";
                await spotifyPost(name, `/me/player/next${params}`);
                return { content: [{ type: "text" as const, text: "Skipped to next." }] };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-previous",
        "Skip to previous track (requires admin role)",
        { device_id: z.string().optional(), account: accountParam },
        withAcl("spotify-previous", async ({ device_id, account }, _extra) => {
            try {
                const name = await resolveAccountName(account);
                const params = device_id ? `?device_id=${device_id}` : "";
                await spotifyPost(name, `/me/player/previous${params}`);
                return { content: [{ type: "text" as const, text: "Skipped to previous." }] };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-set-volume",
        "Set playback volume (requires admin role)",
        {
            volume_percent: z.number().min(0).max(100),
            device_id: z.string().optional(),
            account: accountParam,
        },
        withAcl("spotify-set-volume", async ({ volume_percent, device_id, account }, _extra) => {
            try {
                const name = await resolveAccountName(account);
                const params: Record<string, string> = { volume_percent: String(volume_percent) };
                if (device_id) params.device_id = device_id;
                await spotifyPut(name, `/me/player/volume?${new URLSearchParams(params).toString()}`);
                return { content: [{ type: "text" as const, text: `Volume set to ${volume_percent}%.` }] };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-devices",
        "Get available playback devices",
        { account: accountParam },
        async ({ account }) => {
            try {
                const name = await resolveAccountName(account);
                const data = await spotifyGet(name, "/me/player/devices");
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    // ═══════════════════════════════════════════════════
    // QUEUE
    // ═══════════════════════════════════════════════════

    mcpServer.tool(
        "spotify-get-queue",
        "Get the current playback queue",
        { account: accountParam },
        async ({ account }) => {
            try {
                const name = await resolveAccountName(account);
                const data = await spotifyGet(name, "/me/player/queue");
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-add-to-queue",
        "Add a track to the playback queue (requires admin role)",
        {
            uri: z.string().describe("Spotify track URI"),
            device_id: z.string().optional(),
            account: accountParam,
        },
        withAcl("spotify-add-to-queue", async ({ uri, device_id, account }, _extra) => {
            try {
                const name = await resolveAccountName(account);
                const params: Record<string, string> = { uri };
                if (device_id) params.device_id = device_id;
                await spotifyPost(name, `/me/player/queue?${new URLSearchParams(params).toString()}`);
                return { content: [{ type: "text" as const, text: "Added to queue." }] };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    // ═══════════════════════════════════════════════════
    // LIBRARY
    // ═══════════════════════════════════════════════════

    mcpServer.tool(
        "spotify-saved-tracks",
        "Get the user's saved/liked tracks",
        {
            limit: z.number().min(1).max(50).default(20).optional(),
            offset: z.number().default(0).optional(),
            account: accountParam,
        },
        async ({ limit, offset, account }) => {
            try {
                const name = await resolveAccountName(account);
                const data = await spotifyGet(name, "/me/tracks", {
                    limit: String(limit || 20),
                    offset: String(offset || 0),
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-save-tracks",
        "Save tracks to the user's library (requires editor role)",
        {
            ids: z.array(z.string()).describe("Array of Spotify track IDs"),
            account: accountParam,
        },
        withAcl("spotify-save-tracks", async ({ ids, account }, _extra) => {
            try {
                const name = await resolveAccountName(account);
                await spotifyPut(name, `/me/tracks?ids=${ids.join(",")}`);
                return { content: [{ type: "text" as const, text: `Saved ${ids.length} track(s).` }] };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    mcpServer.tool(
        "spotify-remove-saved-tracks",
        "Remove tracks from the user's library (requires editor role)",
        {
            ids: z.array(z.string()).describe("Array of Spotify track IDs"),
            account: accountParam,
        },
        withAcl("spotify-remove-saved-tracks", async ({ ids, account }, _extra) => {
            try {
                const name = await resolveAccountName(account);
                await spotifyDelete(name, `/me/tracks?ids=${ids.join(",")}`);
                return { content: [{ type: "text" as const, text: `Removed ${ids.length} track(s).` }] };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }),
    );

    // ═══════════════════════════════════════════════════
    // USER INSIGHTS
    // ═══════════════════════════════════════════════════

    mcpServer.tool(
        "spotify-top-items",
        "Get the user's top artists or tracks",
        {
            type: z.enum(["artists", "tracks"]),
            time_range: z.enum(["short_term", "medium_term", "long_term"]).default("medium_term").optional(),
            limit: z.number().min(1).max(50).default(20).optional(),
            offset: z.number().default(0).optional(),
            account: accountParam,
        },
        async ({ type, time_range, limit, offset, account }) => {
            try {
                const name = await resolveAccountName(account);
                const data = await spotifyGet(name, `/me/top/${type}`, {
                    time_range: time_range || "medium_term",
                    limit: String(limit || 20),
                    offset: String(offset || 0),
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

    mcpServer.tool(
        "spotify-recently-played",
        "Get recently played tracks",
        {
            limit: z.number().min(1).max(50).default(20).optional(),
            account: accountParam,
        },
        async ({ limit, account }) => {
            try {
                const name = await resolveAccountName(account);
                const data = await spotifyGet(name, "/me/player/recently-played", {
                    limit: String(limit || 20),
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
                };
            } catch (err) {
                return {
                    content: [{ type: "text" as const, text: `Error: ${formatError(err)}` }],
                    isError: true,
                };
            }
        }
    );

}
