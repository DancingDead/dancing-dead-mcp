import { tasks, tasks_v1 } from "@googleapis/tasks";
import { OAuth2Client } from "google-auth-library";
import { ensureValidToken } from "./auth.js";
import { getGoogleWorkspaceConfig } from "./auth.js";
import { logger } from "../../config.js";

// ── Create authenticated Tasks client ────────────

async function getAuthenticatedTasksClient(accountName: string) {
    const accessToken = await ensureValidToken(accountName);
    const { clientId, clientSecret, redirectUri } = getGoogleWorkspaceConfig();

    const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        redirectUri
    );

    oauth2Client.setCredentials({
        access_token: accessToken,
    });

    return tasks({ version: "v1", auth: oauth2Client });
}

// ── TaskLists Operations ─────────────────────────

export async function listTaskLists(
    accountName: string,
    maxResults: number = 20
): Promise<tasks_v1.Schema$TaskList[]> {
    try {
        logger.debug(`[google-tasks] Listing task lists for account "${accountName}"`);

        const client = await getAuthenticatedTasksClient(accountName);

        const response = await client.tasklists.list({
            maxResults,
        });

        return response.data.items || [];
    } catch (error) {
        logger.error("[google-tasks] Failed to list task lists:", error);
        throw new Error(`Failed to list task lists: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function createTaskList(
    accountName: string,
    title: string
): Promise<tasks_v1.Schema$TaskList> {
    try {
        logger.debug(`[google-tasks] Creating task list "${title}" for account "${accountName}"`);

        const client = await getAuthenticatedTasksClient(accountName);

        const response = await client.tasklists.insert({
            requestBody: { title },
        });

        logger.info(`[google-tasks] Task list created: ${response.data.id}`);
        return response.data;
    } catch (error) {
        logger.error("[google-tasks] Failed to create task list:", error);
        throw new Error(`Failed to create task list: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// ── Tasks Operations ─────────────────────────────

export interface ListTasksParams {
    task_list_id?: string;   // defaults to "@default"
    max_results?: number;
    show_completed?: boolean;
    show_hidden?: boolean;
    due_min?: string;        // RFC 3339
    due_max?: string;        // RFC 3339
}

export async function listTasks(
    accountName: string,
    params: ListTasksParams = {}
): Promise<tasks_v1.Schema$Task[]> {
    try {
        const taskListId = params.task_list_id || "@default";
        logger.debug(`[google-tasks] Listing tasks in "${taskListId}" for account "${accountName}"`);

        const client = await getAuthenticatedTasksClient(accountName);

        const response = await client.tasks.list({
            tasklist: taskListId,
            maxResults: params.max_results || 100,
            showCompleted: params.show_completed ?? true,
            showHidden: params.show_hidden ?? false,
            dueMin: params.due_min,
            dueMax: params.due_max,
        });

        return response.data.items || [];
    } catch (error) {
        logger.error("[google-tasks] Failed to list tasks:", error);
        throw new Error(`Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function getTask(
    accountName: string,
    taskListId: string = "@default",
    taskId: string
): Promise<tasks_v1.Schema$Task> {
    try {
        logger.debug(`[google-tasks] Getting task ${taskId} for account "${accountName}"`);

        const client = await getAuthenticatedTasksClient(accountName);

        const response = await client.tasks.get({
            tasklist: taskListId,
            task: taskId,
        });

        return response.data;
    } catch (error) {
        logger.error("[google-tasks] Failed to get task:", error);
        throw new Error(`Failed to get task: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export interface CreateTaskParams {
    task_list_id?: string;  // defaults to "@default"
    title: string;
    notes?: string;
    due?: string;           // RFC 3339 date
}

export async function createTask(
    accountName: string,
    params: CreateTaskParams
): Promise<tasks_v1.Schema$Task> {
    try {
        const taskListId = params.task_list_id || "@default";
        logger.debug(`[google-tasks] Creating task "${params.title}" in "${taskListId}" for account "${accountName}"`);

        const client = await getAuthenticatedTasksClient(accountName);

        const response = await client.tasks.insert({
            tasklist: taskListId,
            requestBody: {
                title: params.title,
                notes: params.notes,
                due: params.due,
            },
        });

        logger.info(`[google-tasks] Task created: ${response.data.id}`);
        return response.data;
    } catch (error) {
        logger.error("[google-tasks] Failed to create task:", error);
        throw new Error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export interface UpdateTaskParams {
    task_list_id?: string;  // defaults to "@default"
    task_id: string;
    title?: string;
    notes?: string;
    due?: string;
    status?: "needsAction" | "completed";
}

export async function updateTask(
    accountName: string,
    params: UpdateTaskParams
): Promise<tasks_v1.Schema$Task> {
    try {
        const taskListId = params.task_list_id || "@default";
        logger.debug(`[google-tasks] Updating task ${params.task_id} in "${taskListId}" for account "${accountName}"`);

        const client = await getAuthenticatedTasksClient(accountName);

        // Build patch body with only provided fields
        const body: tasks_v1.Schema$Task = {};
        if (params.title !== undefined) body.title = params.title;
        if (params.notes !== undefined) body.notes = params.notes;
        if (params.due !== undefined) body.due = params.due;
        if (params.status !== undefined) body.status = params.status;

        const response = await client.tasks.patch({
            tasklist: taskListId,
            task: params.task_id,
            requestBody: body,
        });

        logger.info(`[google-tasks] Task updated: ${response.data.id}`);
        return response.data;
    } catch (error) {
        logger.error("[google-tasks] Failed to update task:", error);
        throw new Error(`Failed to update task: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function deleteTask(
    accountName: string,
    taskListId: string = "@default",
    taskId: string
): Promise<string> {
    try {
        logger.debug(`[google-tasks] Deleting task ${taskId} for account "${accountName}"`);

        const client = await getAuthenticatedTasksClient(accountName);

        await client.tasks.delete({
            tasklist: taskListId,
            task: taskId,
        });

        logger.info(`[google-tasks] Task deleted: ${taskId}`);
        return `Task ${taskId} deleted successfully`;
    } catch (error) {
        logger.error("[google-tasks] Failed to delete task:", error);
        throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function completeTask(
    accountName: string,
    taskListId: string = "@default",
    taskId: string
): Promise<tasks_v1.Schema$Task> {
    try {
        logger.debug(`[google-tasks] Completing task ${taskId} for account "${accountName}"`);

        const client = await getAuthenticatedTasksClient(accountName);

        const response = await client.tasks.patch({
            tasklist: taskListId,
            task: taskId,
            requestBody: {
                status: "completed",
            },
        });

        logger.info(`[google-tasks] Task completed: ${taskId}`);
        return response.data;
    } catch (error) {
        logger.error("[google-tasks] Failed to complete task:", error);
        throw new Error(`Failed to complete task: ${error instanceof Error ? error.message : String(error)}`);
    }
}
