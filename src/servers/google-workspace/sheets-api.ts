import { sheets, sheets_v4 } from "@googleapis/sheets";
import { OAuth2Client } from "google-auth-library";
import { ensureValidToken, getGoogleWorkspaceConfig } from "./auth.js";
import { logger } from "../../config.js";

// ── Create authenticated Sheets client ────────────

async function getAuthenticatedSheetsClient(accountName: string) {
    const accessToken = await ensureValidToken(accountName);
    const { clientId, clientSecret, redirectUri } = getGoogleWorkspaceConfig();

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ access_token: accessToken });

    return sheets({ version: "v4", auth: oauth2Client });
}

// ── Sheets API Operations ─────────────────────────

export interface ReadSheetParams {
    spreadsheet_id: string;
    ranges?: string[];   // A1 notation, e.g. ["Sheet1!A1:B10"]
    sheet_id?: number;   // Specific sheet ID
}

export async function readSheet(
    accountName: string,
    params: ReadSheetParams
): Promise<sheets_v4.Schema$ValueRange[]> {
    try {
        logger.debug(`[google-sheets] Reading sheet ${params.spreadsheet_id} for account "${accountName}"`);

        const client = await getAuthenticatedSheetsClient(accountName);

        if (params.ranges && params.ranges.length > 0) {
            const response = await client.spreadsheets.values.batchGet({
                spreadsheetId: params.spreadsheet_id,
                ranges: params.ranges,
            });
            return response.data.valueRanges || [];
        }

        if (params.sheet_id !== undefined) {
            // Resolve sheet name from sheet ID
            const metadata = await client.spreadsheets.get({
                spreadsheetId: params.spreadsheet_id,
                fields: "sheets.properties",
            });
            const sheet = metadata.data.sheets?.find(
                (s) => s.properties?.sheetId === params.sheet_id
            );
            if (!sheet?.properties?.title) {
                throw new Error(`Sheet ID ${params.sheet_id} not found`);
            }
            const response = await client.spreadsheets.values.get({
                spreadsheetId: params.spreadsheet_id,
                range: sheet.properties.title,
            });
            return [response.data];
        }

        // Default: read first sheet
        const response = await client.spreadsheets.values.get({
            spreadsheetId: params.spreadsheet_id,
            range: "A:ZZ",
        });
        return [response.data];
    } catch (error) {
        logger.error("[google-sheets] Failed to read sheet:", error);
        throw new Error(`Failed to read sheet: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export interface UpdateCellParams {
    spreadsheet_id: string;
    range: string;         // A1 notation, e.g. "Sheet1!A1"
    value: string;
}

export async function updateCell(
    accountName: string,
    params: UpdateCellParams
): Promise<string> {
    try {
        logger.debug(`[google-sheets] Updating cell ${params.range} in ${params.spreadsheet_id}`);

        const client = await getAuthenticatedSheetsClient(accountName);

        await client.spreadsheets.values.update({
            spreadsheetId: params.spreadsheet_id,
            range: params.range,
            valueInputOption: "RAW",
            requestBody: { values: [[params.value]] },
        });

        logger.info(`[google-sheets] Cell updated: ${params.range}`);
        return `Updated cell ${params.range} to value: ${params.value}`;
    } catch (error) {
        logger.error("[google-sheets] Failed to update cell:", error);
        throw new Error(`Failed to update cell: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export interface AppendRowsParams {
    spreadsheet_id: string;
    range: string;         // e.g. "Sheet1!A:Z"
    values: string[][];    // Array of row arrays
}

export async function appendRows(
    accountName: string,
    params: AppendRowsParams
): Promise<string> {
    try {
        logger.debug(`[google-sheets] Appending ${params.values.length} rows to ${params.spreadsheet_id}`);

        const client = await getAuthenticatedSheetsClient(accountName);

        const response = await client.spreadsheets.values.append({
            spreadsheetId: params.spreadsheet_id,
            range: params.range,
            valueInputOption: "RAW",
            requestBody: { values: params.values },
        });

        const updatedRange = response.data.updates?.updatedRange || params.range;
        logger.info(`[google-sheets] Rows appended at ${updatedRange}`);
        return `Appended ${params.values.length} row(s) at ${updatedRange}`;
    } catch (error) {
        logger.error("[google-sheets] Failed to append rows:", error);
        throw new Error(`Failed to append rows: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export interface CreateSpreadsheetParams {
    title: string;
    sheet_titles?: string[];  // names of sheets to create
}

export async function createSpreadsheet(
    accountName: string,
    params: CreateSpreadsheetParams
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    try {
        logger.debug(`[google-sheets] Creating spreadsheet "${params.title}"`);

        const client = await getAuthenticatedSheetsClient(accountName);

        const sheetProperties = params.sheet_titles
            ? params.sheet_titles.map((title) => ({ properties: { title } }))
            : undefined;

        const response = await client.spreadsheets.create({
            requestBody: {
                properties: { title: params.title },
                sheets: sheetProperties,
            },
        });

        const id = response.data.spreadsheetId || "";
        const url = response.data.spreadsheetUrl || "";
        logger.info(`[google-sheets] Spreadsheet created: ${id}`);
        return { spreadsheetId: id, spreadsheetUrl: url };
    } catch (error) {
        logger.error("[google-sheets] Failed to create spreadsheet:", error);
        throw new Error(`Failed to create spreadsheet: ${error instanceof Error ? error.message : String(error)}`);
    }
}
