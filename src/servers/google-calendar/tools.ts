import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as api from "./api.js";
import * as tasksApi from "./tasks-api.js";
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

    // Tool: google-tasks-list-task-lists
    server.tool(
        "google-tasks-list-task-lists",
        "List all task lists from Google Tasks",
        {
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const taskLists = await tasksApi.listTaskLists(accountName);

                if (taskLists.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "No task lists found.",
                            },
                        ],
                    };
                }

                const list = taskLists
                    .map((tl, i) => `${i + 1}. ${tl.title || "Untitled"}\n   ID: ${tl.id}`)
                    .join("\n\n");

                return {
                    content: [
                        {
                            type: "text",
                            text: `Found ${taskLists.length} task list(s):\n\n${list}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-tasks] list-task-lists error:", error);
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

    // Tool: google-tasks-create-task-list
    server.tool(
        "google-tasks-create-task-list",
        "Create a new task list in Google Tasks",
        {
            title: z.string().describe("Title of the new task list"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const taskList = await tasksApi.createTaskList(accountName, args.title);

                return {
                    content: [
                        {
                            type: "text",
                            text: `Task list created successfully!\n\nTitle: ${taskList.title}\nID: ${taskList.id}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-tasks] create-task-list error:", error);
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

    // Tool: google-tasks-list-tasks
    server.tool(
        "google-tasks-list-tasks",
        "List tasks from a Google Tasks list",
        {
            task_list_id: z.string().optional().describe("Task list ID (defaults to primary list '@default')"),
            max_results: z.number().optional().describe("Maximum number of tasks to return (default: 100)"),
            show_completed: z.boolean().optional().describe("Whether to show completed tasks (default: true)"),
            due_min: z.string().optional().describe("Filter tasks due after this date (RFC 3339 format)"),
            due_max: z.string().optional().describe("Filter tasks due before this date (RFC 3339 format)"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const tasks = await tasksApi.listTasks(accountName, {
                    task_list_id: args.task_list_id,
                    max_results: args.max_results,
                    show_completed: args.show_completed,
                    due_min: args.due_min,
                    due_max: args.due_max,
                });

                if (tasks.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "No tasks found.",
                            },
                        ],
                    };
                }

                const taskList = tasks
                    .map((t, i) => {
                        const status = t.status === "completed" ? "[x]" : "[ ]";
                        const due = t.due ? `\n   Due: ${t.due}` : "";
                        const notes = t.notes ? `\n   Notes: ${t.notes}` : "";
                        return `${i + 1}. ${status} ${t.title || "No title"}${due}${notes}\n   ID: ${t.id}`;
                    })
                    .join("\n\n");

                return {
                    content: [
                        {
                            type: "text",
                            text: `Found ${tasks.length} task(s):\n\n${taskList}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-tasks] list-tasks error:", error);
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

    // Tool: google-tasks-get-task
    server.tool(
        "google-tasks-get-task",
        "Get details of a specific task from Google Tasks",
        {
            task_id: z.string().describe("The ID of the task to retrieve"),
            task_list_id: z.string().optional().describe("Task list ID (defaults to '@default')"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const task = await tasksApi.getTask(accountName, args.task_list_id || "@default", args.task_id);

                const details = `Task Details:
                Title: ${task.title || "No title"}
                Notes: ${task.notes || "No notes"}
                Status: ${task.status || "Unknown"}
                Due: ${task.due || "No due date"}
                Completed: ${task.completed || "Not completed"}
                Updated: ${task.updated || "Unknown"}
                Link: ${task.webViewLink || "No link"}
                ID: ${task.id || "No ID"}`;

                return {
                    content: [
                        {
                            type: "text",
                            text: details,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-tasks] get-task error:", error);
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

    // Tool: google-tasks-create-task
    server.tool(
        "google-tasks-create-task",
        "Create a new task in Google Tasks",
        {
            title: z.string().describe("Task title (max 1024 characters)"),
            notes: z.string().optional().describe("Task notes/description (max 8192 characters)"),
            due: z.string().optional().describe("Due date in RFC 3339 format (e.g., 2024-01-15T00:00:00Z). Only date part is used."),
            task_list_id: z.string().optional().describe("Task list ID (defaults to '@default')"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const task = await tasksApi.createTask(accountName, {
                    title: args.title,
                    notes: args.notes,
                    due: args.due,
                    task_list_id: args.task_list_id,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Task created successfully!\n\nTitle: ${task.title}\nID: ${task.id}${task.due ? `\nDue: ${task.due}` : ""}${task.webViewLink ? `\nLink: ${task.webViewLink}` : ""}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-tasks] create-task error:", error);
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

    // Tool: google-tasks-update-task
    server.tool(
        "google-tasks-update-task",
        "Update an existing task in Google Tasks",
        {
            task_id: z.string().describe("The ID of the task to update"),
            title: z.string().optional().describe("New task title"),
            notes: z.string().optional().describe("New task notes"),
            due: z.string().optional().describe("New due date in RFC 3339 format"),
            status: z.enum(["needsAction", "completed"]).optional().describe("New task status"),
            task_list_id: z.string().optional().describe("Task list ID (defaults to '@default')"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const task = await tasksApi.updateTask(accountName, {
                    task_id: args.task_id,
                    title: args.title,
                    notes: args.notes,
                    due: args.due,
                    status: args.status,
                    task_list_id: args.task_list_id,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Task updated successfully!\n\nTitle: ${task.title}\nStatus: ${task.status}\nID: ${task.id}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-tasks] update-task error:", error);
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

    // Tool: google-tasks-delete-task
    server.tool(
        "google-tasks-delete-task",
        "Delete a task from Google Tasks",
        {
            task_id: z.string().describe("The ID of the task to delete"),
            task_list_id: z.string().optional().describe("Task list ID (defaults to '@default')"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const result = await tasksApi.deleteTask(accountName, args.task_list_id || "@default", args.task_id);

                return {
                    content: [
                        {
                            type: "text",
                            text: result,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-tasks] delete-task error:", error);
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

    // Tool: google-tasks-complete-task
    server.tool(
        "google-tasks-complete-task",
        "Mark a task as completed in Google Tasks",
        {
            task_id: z.string().describe("The ID of the task to complete"),
            task_list_id: z.string().optional().describe("Task list ID (defaults to '@default')"),
            account: accountParam,
        },
        async (args) => {
            try {
                const accountName = await resolveAccountName(args.account);
                const task = await tasksApi.completeTask(accountName, args.task_list_id || "@default", args.task_id);

                return {
                    content: [
                        {
                            type: "text",
                            text: `Task completed!\n\nTitle: ${task.title}\nStatus: ${task.status}\nID: ${task.id}`,
                        },
                    ],
                };
            } catch (error) {
                logger.error("[google-tasks] complete-task error:", error);
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


}