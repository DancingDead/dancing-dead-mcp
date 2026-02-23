import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as api from "./api.js";
import { listAccounts, resolveAccountName } from "./store.js";
import { generateAuthUrl } from "./auth.js";
import { logger } from "../../config.js";

// ── Reusable account parameter ─────────────────────

const accountParam = z.string().optional().describe(
    "Account name to use (optional if only one account is connected)"
);

// ── Register Tools ───────────────────────────────────

export function registerGoogleCalendarTools(server: McpServer): void {
    // Tool: google-calendar-create-event
    server.tool(
        "google-calendar-create-event",
        "Create a new event in Google Calendar",
        {
            summary: z.string().describe("Event title"),
            description: z.string().optional().describe("Event description"),
            start_time: z.string().describe("Start time in ISO format (e.g., 2024-01-15T10:00:00Z)"),
            end_time: z.string().describe("End time in ISO format (e.g., 2024-01-15T11:00:00Z)"),
            attendees: z.array(z.string()).optional().describe("List of attendee email addresses"),
            location: z.string().optional().describe("Event location"),
            timezone: z.string().optional().describe("Timezone (e.g., America/New_York, Europe/Paris). Defaults to UTC"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const eventLink = await api.createEvent(accountName, {
                    summary: args.summary,
                    description: args.description,
                    start_time: args.start_time,
                    end_time: args.end_time,
                    attendees: args.attendees,
                    location: args.location,
                    timezone: args.timezone,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Event created successfully!\n\nTitle: ${args.summary}\nLink: ${eventLink}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-calendar] create-event error:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Tool: google-calendar-list-events
    server.tool(
        "google-calendar-list-events",
        "List upcoming events from Google Calendar",
        {
            max_results: z.number().optional().describe("Maximum number of events to return (default: 10)"),
            time_min: z.string().optional().describe("Filter events starting after this time (ISO format)"),
            time_max: z.string().optional().describe("Filter events starting before this time (ISO format)"),
            query: z.string().optional().describe("Search query to filter events"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const events = await api.listEvents(accountName, {
                    max_results: args.max_results,
                    time_min: args.time_min,
                    time_max: args.time_max,
                    query: args.query,
                });

                if (events.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "No events found.",
                            },
                        ],
                    };
                }

                const eventList = events
                    .map((event, index) => {
                        const start = event.start?.dateTime || event.start?.date || "No start time";
                        const summary = event.summary || "No title";
                        const id = event.id || "No ID";
                        return `${index + 1}. ${summary}\n   Start: ${start}\n   ID: ${id}`;
                    })
                    .join("\n\n");

                return {
                    content: [
                        {
                            type: "text",
                            text: `Found ${events.length} event(s):\n\n${eventList}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-calendar] list-events error:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Tool: google-calendar-get-event
    server.tool(
        "google-calendar-get-event",
        "Get details of a specific event from Google Calendar",
        {
            event_id: z.string().describe("The ID of the event to retrieve"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const event = await api.getEvent(accountName, args.event_id);

                const details = `Event Details:
Title: ${event.summary || "No title"}
Description: ${event.description || "No description"}
Location: ${event.location || "No location"}
Start: ${event.start?.dateTime || event.start?.date || "No start time"}
End: ${event.end?.dateTime || event.end?.date || "No end time"}
Attendees: ${event.attendees?.map((a: any) => a.email).join(", ") || "None"}
Link: ${event.htmlLink || "No link"}
ID: ${event.id || "No ID"}`;

                return {
                    content: [
                        {
                            type: "text",
                            text: details,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-calendar] get-event error:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Tool: google-calendar-update-event
    server.tool(
        "google-calendar-update-event",
        "Update an existing event in Google Calendar",
        {
            event_id: z.string().describe("The ID of the event to update"),
            summary: z.string().optional().describe("New event title"),
            description: z.string().optional().describe("New event description"),
            start_time: z.string().optional().describe("New start time in ISO format"),
            end_time: z.string().optional().describe("New end time in ISO format"),
            attendees: z.array(z.string()).optional().describe("New list of attendee email addresses"),
            location: z.string().optional().describe("New event location"),
            timezone: z.string().optional().describe("Timezone for the new times"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const eventLink = await api.updateEvent(accountName, {
                    event_id: args.event_id,
                    summary: args.summary,
                    description: args.description,
                    start_time: args.start_time,
                    end_time: args.end_time,
                    attendees: args.attendees,
                    location: args.location,
                    timezone: args.timezone,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Event updated successfully!\n\nLink: ${eventLink}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-calendar] update-event error:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Tool: google-calendar-delete-event
    server.tool(
        "google-calendar-delete-event",
        "Delete an event from Google Calendar",
        {
            event_id: z.string().describe("The ID of the event to delete"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const result = await api.deleteEvent(accountName, args.event_id);

                return {
                    content: [
                        {
                            type: "text",
                            text: result,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-calendar] delete-event error:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Tool: google-calendar-auth
    server.tool(
        "google-calendar-auth",
        "Start OAuth flow to connect a Google Calendar account",
        {
            account_name: z.string().describe("A name for this Google Calendar account (e.g., 'personal', 'work')"),
        },
        async (args) => {
            try {
                const authUrl = generateAuthUrl(args.account_name);

                return {
                    content: [
                        {
                            type: "text",
                            text: `To connect your Google Calendar account "${args.account_name}", please visit:\n\n${authUrl}\n\nAfter authorizing, you'll be redirected to the callback URL and the account will be saved.`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-calendar] auth error:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Tool: google-calendar-list-accounts
    server.tool(
        "google-calendar-list-accounts",
        "List all connected Google Calendar accounts",
        {},
        async () => {
            try {
                const accounts = await listAccounts();

                if (accounts.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "No Google Calendar accounts connected. Use google-calendar-auth to connect one.",
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `Connected accounts: ${accounts.join(", ")}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-calendar] list-accounts error:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],

                };
            }
        }
    );
}