import { calendar, calendar_v3 } from "@googleapis/calendar";
import { OAuth2Client } from "google-auth-library";
import { ensureValidToken } from "./auth.js";
import { getGoogleCalendarConfig } from "./auth.js";
import { logger } from "../../config.js";

// ── Create authenticated Calendar client ────────────

async function getAuthenticatedClient(accountName: string) {
    const accessToken = await ensureValidToken(accountName);
    const { clientId, clientSecret, redirectUri } = getGoogleCalendarConfig();

    const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        redirectUri
    );

    oauth2Client.setCredentials({
        access_token: accessToken,
    });

    return calendar({ version: "v3", auth: oauth2Client });
}

// ── Calendar API Operations ─────────────────────────

export interface CreateEventParams {
    summary: string;
    description?: string;
    start_time: string; // ISO format
    end_time: string;   // ISO format
    attendees?: string[];
    location?: string;
    timezone?: string;
}

export async function createEvent(
    accountName: string,
    params: CreateEventParams
): Promise<string> {
    try {
        logger.debug(`[google-calendar] Creating event for account "${accountName}"`);

        const calendar = await getAuthenticatedClient(accountName);

        const event: calendar_v3.Schema$Event = {
            summary: params.summary,
            description: params.description,
            location: params.location,
            start: {
                dateTime: params.start_time,
                timeZone: params.timezone || "UTC",
            },
            end: {
                dateTime: params.end_time,
                timeZone: params.timezone || "UTC",
            },
        };

        if (params.attendees && params.attendees.length > 0) {
            event.attendees = params.attendees.map(email => ({ email }));
        }

        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
        });

        const eventLink = response.data.htmlLink || "Event created (no link available)";
        logger.info(`[google-calendar] Event created: ${eventLink}`);

        return eventLink;
    } catch (error) {
        logger.error("[google-calendar] Failed to create event:", error);
        throw new Error(`Failed to create event: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export interface ListEventsParams {
    max_results?: number;
    time_min?: string; // ISO format
    time_max?: string; // ISO format
    query?: string;    // Search query
}

export async function listEvents(
    accountName: string,
    params: ListEventsParams = {}
): Promise<calendar_v3.Schema$Event[]> {
    try {
        logger.debug(`[google-calendar] Listing events for account "${accountName}"`);

        const calendar = await getAuthenticatedClient(accountName);

        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: params.time_min,
            timeMax: params.time_max,
            maxResults: params.max_results || 10,
            singleEvents: true,
            orderBy: "startTime",
            q: params.query,
        });

        return response.data.items || [];
    } catch (error) {
        logger.error("[google-calendar] Failed to list events:", error);
        throw new Error(`Failed to list events: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function getEvent(
    accountName: string,
    eventId: string
): Promise<calendar_v3.Schema$Event> {
    try {
        logger.debug(`[google-calendar] Getting event ${eventId} for account "${accountName}"`);

        const calendar = await getAuthenticatedClient(accountName);

        const response = await calendar.events.get({
            calendarId: "primary",
            eventId,
        });

        return response.data;
    } catch (error) {
        logger.error("[google-calendar] Failed to get event:", error);
        throw new Error(`Failed to get event: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export interface UpdateEventParams {
    event_id: string;
    summary?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    attendees?: string[];
    location?: string;
    timezone?: string;
}

export async function updateEvent(
    accountName: string,
    params: UpdateEventParams
): Promise<string> {
    try {
        logger.debug(`[google-calendar] Updating event ${params.event_id} for account "${accountName}"`);

        const calendar = await getAuthenticatedClient(accountName);

        // First get the existing event
        const existing = await getEvent(accountName, params.event_id);

        const event: calendar_v3.Schema$Event = {
            ...existing,
            summary: params.summary !== undefined ? params.summary : existing.summary,
            description: params.description !== undefined ? params.description : existing.description,
            location: params.location !== undefined ? params.location : existing.location,
        };

        if (params.start_time) {
            event.start = {
                dateTime: params.start_time,
                timeZone: params.timezone || existing.start?.timeZone || "UTC",
            };
        }

        if (params.end_time) {
            event.end = {
                dateTime: params.end_time,
                timeZone: params.timezone || existing.end?.timeZone || "UTC",
            };
        }

        if (params.attendees !== undefined) {
            event.attendees = params.attendees.map(email => ({ email }));
        }

        const response = await calendar.events.update({
            calendarId: "primary",
            eventId: params.event_id,
            requestBody: event,
        });

        const eventLink = response.data.htmlLink || "Event updated (no link available)";
        logger.info(`[google-calendar] Event updated: ${eventLink}`);

        return eventLink;
    } catch (error) {
        logger.error("[google-calendar] Failed to update event:", error);
        throw new Error(`Failed to update event: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function deleteEvent(
    accountName: string,
    eventId: string
): Promise<string> {
    try {
        logger.debug(`[google-calendar] Deleting event ${eventId} for account "${accountName}"`);

        const calendar = await getAuthenticatedClient(accountName);

        await calendar.events.delete({
            calendarId: "primary",
            eventId,
        });

        logger.info(`[google-calendar] Event deleted: ${eventId}`);
        return `Event ${eventId} deleted successfully`;
    } catch (error) {
        logger.error("[google-calendar] Failed to delete event:", error);
        throw new Error(`Failed to delete event: ${error instanceof Error ? error.message : String(error)}`);
    }
}