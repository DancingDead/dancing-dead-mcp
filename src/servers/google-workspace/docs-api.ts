import { docs, docs_v1 } from "@googleapis/docs";
import { OAuth2Client } from "google-auth-library";
import { ensureValidToken, getGoogleWorkspaceConfig } from "./auth.js";
import { logger } from "../../config.js";

// ── Create authenticated Docs client ────────────

async function getAuthenticatedDocsClient(accountName: string) {
    const accessToken = await ensureValidToken(accountName);
    const { clientId, clientSecret, redirectUri } = getGoogleWorkspaceConfig();

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ access_token: accessToken });

    return docs({ version: "v1", auth: oauth2Client });
}

// ── Helper: extract plain text from Docs structure ──

function extractTextFromDocument(document: docs_v1.Schema$Document): string {
    const content = document.body?.content || [];
    let text = "";

    for (const element of content) {
        if (element.paragraph) {
            for (const paragraphElement of element.paragraph.elements || []) {
                if (paragraphElement.textRun?.content) {
                    text += paragraphElement.textRun.content;
                }
            }
        }
        if (element.table) {
            for (const row of element.table.tableRows || []) {
                const cells: string[] = [];
                for (const cell of row.tableCells || []) {
                    let cellText = "";
                    for (const cellContent of cell.content || []) {
                        if (cellContent.paragraph) {
                            for (const pe of cellContent.paragraph.elements || []) {
                                if (pe.textRun?.content) {
                                    cellText += pe.textRun.content.trim();
                                }
                            }
                        }
                    }
                    cells.push(cellText);
                }
                text += cells.join("\t") + "\n";
            }
        }
    }

    return text;
}

// ── Docs API Operations ─────────────────────────

export async function readDocument(
    accountName: string,
    documentId: string
): Promise<{ title: string; content: string }> {
    try {
        logger.debug(`[google-docs] Reading document ${documentId} for account "${accountName}"`);

        const client = await getAuthenticatedDocsClient(accountName);

        const response = await client.documents.get({ documentId });

        const title = response.data.title || "Untitled";
        const content = extractTextFromDocument(response.data);

        logger.info(`[google-docs] Document read: ${title}`);
        return { title, content };
    } catch (error) {
        logger.error("[google-docs] Failed to read document:", error);
        throw new Error(`Failed to read document: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function createDocument(
    accountName: string,
    title: string,
    body?: string
): Promise<{ documentId: string; documentUrl: string }> {
    try {
        logger.debug(`[google-docs] Creating document "${title}"`);

        const client = await getAuthenticatedDocsClient(accountName);

        const response = await client.documents.create({
            requestBody: { title },
        });

        const docId = response.data.documentId || "";

        // If body text is provided, insert it
        if (body && docId) {
            await client.documents.batchUpdate({
                documentId: docId,
                requestBody: {
                    requests: [
                        {
                            insertText: {
                                location: { index: 1 },
                                text: body,
                            },
                        },
                    ],
                },
            });
        }

        const documentUrl = `https://docs.google.com/document/d/${docId}/edit`;
        logger.info(`[google-docs] Document created: ${docId}`);
        return { documentId: docId, documentUrl };
    } catch (error) {
        logger.error("[google-docs] Failed to create document:", error);
        throw new Error(`Failed to create document: ${error instanceof Error ? error.message : String(error)}`);
    }
}
