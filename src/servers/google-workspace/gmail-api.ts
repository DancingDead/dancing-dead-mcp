import { gmail, gmail_v1 } from "@googleapis/gmail";
import { OAuth2Client } from "google-auth-library";
import { ensureValidToken, getGoogleWorkspaceConfig } from "./auth.js";
import { logger } from "../../config.js";

// ── Create authenticated Gmail client ────────────

async function getAuthenticatedGmailClient(accountName: string) {
    const accessToken = await ensureValidToken(accountName);
    const { clientId, clientSecret, redirectUri } = getGoogleWorkspaceConfig();

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ access_token: accessToken });

    return gmail({ version: "v1", auth: oauth2Client });
}

// ── Helpers ──────────────────────────────────────

function decodeBase64Url(data: string): string {
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractEmailBody(payload: gmail_v1.Schema$MessagePart): string {
    // Simple text/plain or text/html body
    if (payload.body?.data) {
        return decodeBase64Url(payload.body.data);
    }

    // Multipart: search for text/plain first, then text/html
    if (payload.parts) {
        const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
        if (textPart?.body?.data) {
            return decodeBase64Url(textPart.body.data);
        }
        const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
        if (htmlPart?.body?.data) {
            return decodeBase64Url(htmlPart.body.data);
        }
        // Recurse into nested multipart
        for (const part of payload.parts) {
            const result = extractEmailBody(part);
            if (result) return result;
        }
    }

    return "";
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
    return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
}

// ── Gmail API Operations ─────────────────────────

export interface ListMessagesParams {
    query?: string;        // Gmail search query
    max_results?: number;
    label_ids?: string[];
}

export interface EmailSummary {
    id: string;
    threadId: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    snippet: string;
    labelIds: string[];
}

export async function listMessages(
    accountName: string,
    params: ListMessagesParams = {}
): Promise<EmailSummary[]> {
    try {
        logger.debug(`[google-gmail] Listing messages for account "${accountName}"`);

        const client = await getAuthenticatedGmailClient(accountName);

        const listResponse = await client.users.messages.list({
            userId: "me",
            q: params.query,
            maxResults: params.max_results || 10,
            labelIds: params.label_ids,
        });

        const messageRefs = listResponse.data.messages || [];
        if (messageRefs.length === 0) return [];

        // Fetch metadata for each message
        const summaries: EmailSummary[] = [];
        for (const ref of messageRefs) {
            if (!ref.id) continue;
            const msg = await client.users.messages.get({
                userId: "me",
                id: ref.id,
                format: "metadata",
                metadataHeaders: ["From", "To", "Subject", "Date"],
            });

            const headers = msg.data.payload?.headers;
            summaries.push({
                id: msg.data.id || "",
                threadId: msg.data.threadId || "",
                from: getHeader(headers, "From"),
                to: getHeader(headers, "To"),
                subject: getHeader(headers, "Subject"),
                date: getHeader(headers, "Date"),
                snippet: msg.data.snippet || "",
                labelIds: msg.data.labelIds || [],
            });
        }

        return summaries;
    } catch (error) {
        logger.error("[google-gmail] Failed to list messages:", error);
        throw new Error(`Failed to list messages: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function readMessage(
    accountName: string,
    messageId: string
): Promise<{ headers: Record<string, string>; body: string; labelIds: string[] }> {
    try {
        logger.debug(`[google-gmail] Reading message ${messageId} for account "${accountName}"`);

        const client = await getAuthenticatedGmailClient(accountName);

        const response = await client.users.messages.get({
            userId: "me",
            id: messageId,
            format: "full",
        });

        const headers = response.data.payload?.headers;
        const body = response.data.payload ? extractEmailBody(response.data.payload) : "";

        return {
            headers: {
                from: getHeader(headers, "From"),
                to: getHeader(headers, "To"),
                cc: getHeader(headers, "Cc"),
                subject: getHeader(headers, "Subject"),
                date: getHeader(headers, "Date"),
            },
            body,
            labelIds: response.data.labelIds || [],
        };
    } catch (error) {
        logger.error("[google-gmail] Failed to read message:", error);
        throw new Error(`Failed to read message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export interface SendEmailParams {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
}

export async function sendEmail(
    accountName: string,
    params: SendEmailParams
): Promise<string> {
    try {
        logger.debug(`[google-gmail] Sending email for account "${accountName}"`);

        const client = await getAuthenticatedGmailClient(accountName);

        // Build RFC 2822 message
        const messageParts = [
            `To: ${params.to}`,
            `Subject: ${params.subject}`,
        ];
        if (params.cc) messageParts.push(`Cc: ${params.cc}`);
        if (params.bcc) messageParts.push(`Bcc: ${params.bcc}`);
        messageParts.push("Content-Type: text/plain; charset=utf-8");
        messageParts.push("");
        messageParts.push(params.body);

        const rawMessage = messageParts.join("\r\n");
        const encodedMessage = Buffer.from(rawMessage)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const response = await client.users.messages.send({
            userId: "me",
            requestBody: { raw: encodedMessage },
        });

        const sentId = response.data.id || "";
        logger.info(`[google-gmail] Email sent: ${sentId}`);
        return sentId;
    } catch (error) {
        logger.error("[google-gmail] Failed to send email:", error);
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function searchEmails(
    accountName: string,
    query: string,
    maxResults: number = 10
): Promise<EmailSummary[]> {
    return listMessages(accountName, { query, max_results: maxResults });
}
