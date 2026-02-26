import { drive, drive_v3 } from "@googleapis/drive";
import { OAuth2Client } from "google-auth-library";
import { ensureValidToken, getGoogleWorkspaceConfig } from "./auth.js";
import { logger } from "../../config.js";

// ── Create authenticated Drive client ────────────

async function getAuthenticatedDriveClient(accountName: string) {
    const accessToken = await ensureValidToken(accountName);
    const { clientId, clientSecret, redirectUri } = getGoogleWorkspaceConfig();

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ access_token: accessToken });

    return drive({ version: "v3", auth: oauth2Client });
}

// ── Drive API Operations ─────────────────────────

export interface SearchFilesParams {
    query: string;
    page_size?: number;
    page_token?: string;
}

export async function searchFiles(
    accountName: string,
    params: SearchFilesParams
): Promise<{ files: drive_v3.Schema$File[]; nextPageToken?: string | null }> {
    try {
        logger.debug(`[google-drive] Searching files for account "${accountName}"`);

        const client = await getAuthenticatedDriveClient(accountName);

        const userQuery = params.query.trim();
        let searchQuery: string;

        if (!userQuery) {
            searchQuery = "trashed = false";
        } else {
            const escapedQuery = userQuery.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            searchQuery = `(name contains '${escapedQuery}' or fullText contains '${escapedQuery}') and trashed = false`;
        }

        const response = await client.files.list({
            q: searchQuery,
            pageSize: params.page_size || 10,
            pageToken: params.page_token || undefined,
            orderBy: "modifiedTime desc",
            fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)",
        });

        return {
            files: response.data.files || [],
            nextPageToken: response.data.nextPageToken,
        };
    } catch (error) {
        logger.error("[google-drive] Failed to search files:", error);
        throw new Error(`Failed to search files: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function readFile(
    accountName: string,
    fileId: string
): Promise<{ name: string; mimeType: string; content: string }> {
    try {
        logger.debug(`[google-drive] Reading file ${fileId} for account "${accountName}"`);

        const client = await getAuthenticatedDriveClient(accountName);

        // Get file metadata
        const fileMeta = await client.files.get({
            fileId,
            fields: "mimeType,name",
        });

        const mimeType = fileMeta.data.mimeType || "application/octet-stream";
        const name = fileMeta.data.name || fileId;

        // Google Workspace files need export
        if (mimeType.startsWith("application/vnd.google-apps")) {
            let exportMimeType: string;
            switch (mimeType) {
                case "application/vnd.google-apps.document":
                    exportMimeType = "text/markdown";
                    break;
                case "application/vnd.google-apps.spreadsheet":
                    exportMimeType = "text/csv";
                    break;
                case "application/vnd.google-apps.presentation":
                    exportMimeType = "text/plain";
                    break;
                case "application/vnd.google-apps.drawing":
                    exportMimeType = "image/png";
                    break;
                default:
                    exportMimeType = "text/plain";
            }

            const res = await client.files.export(
                { fileId, mimeType: exportMimeType },
                { responseType: "text" }
            );

            logger.info(`[google-drive] File exported: ${name} as ${exportMimeType}`);
            return { name, mimeType: exportMimeType, content: res.data as string };
        }

        // Regular files - download content
        const res = await client.files.get(
            { fileId, alt: "media" },
            { responseType: "arraybuffer" }
        );

        const isText = mimeType.startsWith("text/") || mimeType === "application/json";
        const buffer = Buffer.from(res.data as ArrayBuffer);

        logger.info(`[google-drive] File read: ${name}`);
        return {
            name,
            mimeType,
            content: isText ? buffer.toString("utf-8") : buffer.toString("base64"),
        };
    } catch (error) {
        logger.error("[google-drive] Failed to read file:", error);
        throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// ── Drive Edit Operations ────────────────────────

export interface RenameFileParams {
    file_id: string;
    new_name: string;
}

export async function renameFile(
    accountName: string,
    params: RenameFileParams
): Promise<drive_v3.Schema$File> {
    try {
        logger.debug(`[google-drive] Renaming file ${params.file_id} to "${params.new_name}"`);

        const client = await getAuthenticatedDriveClient(accountName);

        const response = await client.files.update({
            fileId: params.file_id,
            requestBody: { name: params.new_name },
            fields: "id, name, mimeType, webViewLink",
        });

        logger.info(`[google-drive] File renamed: ${response.data.name}`);
        return response.data;
    } catch (error) {
        logger.error("[google-drive] Failed to rename file:", error);
        throw new Error(`Failed to rename file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export interface MoveFileParams {
    file_id: string;
    destination_folder_id: string;
}

export async function moveFile(
    accountName: string,
    params: MoveFileParams
): Promise<drive_v3.Schema$File> {
    try {
        logger.debug(`[google-drive] Moving file ${params.file_id} to folder ${params.destination_folder_id}`);

        const client = await getAuthenticatedDriveClient(accountName);

        // Get current parents to remove
        const file = await client.files.get({
            fileId: params.file_id,
            fields: "parents",
        });

        const previousParents = (file.data.parents || []).join(",");

        const response = await client.files.update({
            fileId: params.file_id,
            addParents: params.destination_folder_id,
            removeParents: previousParents,
            fields: "id, name, parents, webViewLink",
        });

        logger.info(`[google-drive] File moved: ${response.data.name}`);
        return response.data;
    } catch (error) {
        logger.error("[google-drive] Failed to move file:", error);
        throw new Error(`Failed to move file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function trashFile(
    accountName: string,
    fileId: string
): Promise<string> {
    try {
        logger.debug(`[google-drive] Trashing file ${fileId}`);

        const client = await getAuthenticatedDriveClient(accountName);

        await client.files.update({
            fileId,
            requestBody: { trashed: true },
        });

        logger.info(`[google-drive] File trashed: ${fileId}`);
        return `File ${fileId} moved to trash`;
    } catch (error) {
        logger.error("[google-drive] Failed to trash file:", error);
        throw new Error(`Failed to trash file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function createFolder(
    accountName: string,
    name: string,
    parentFolderId?: string
): Promise<drive_v3.Schema$File> {
    try {
        logger.debug(`[google-drive] Creating folder "${name}"`);

        const client = await getAuthenticatedDriveClient(accountName);

        const requestBody: drive_v3.Schema$File = {
            name,
            mimeType: "application/vnd.google-apps.folder",
        };

        if (parentFolderId) {
            requestBody.parents = [parentFolderId];
        }

        const response = await client.files.create({
            requestBody,
            fields: "id, name, webViewLink",
        });

        logger.info(`[google-drive] Folder created: ${response.data.id}`);
        return response.data;
    } catch (error) {
        logger.error("[google-drive] Failed to create folder:", error);
        throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// ── Drive List Operations ────────────────────────

export interface ListFolderParams {
    folder_id?: string;  // defaults to "root"
    page_size?: number;
    page_token?: string;
}

export async function listFolderContents(
    accountName: string,
    params: ListFolderParams = {}
): Promise<{ files: drive_v3.Schema$File[]; nextPageToken?: string | null }> {
    try {
        const folderId = params.folder_id || "root";
        logger.debug(`[google-drive] Listing folder ${folderId} for account "${accountName}"`);

        const client = await getAuthenticatedDriveClient(accountName);

        const response = await client.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            pageSize: params.page_size || 20,
            pageToken: params.page_token || undefined,
            orderBy: "folder,name",
            fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)",
        });

        return {
            files: response.data.files || [],
            nextPageToken: response.data.nextPageToken,
        };
    } catch (error) {
        logger.error("[google-drive] Failed to list folder:", error);
        throw new Error(`Failed to list folder: ${error instanceof Error ? error.message : String(error)}`);
    }
}
