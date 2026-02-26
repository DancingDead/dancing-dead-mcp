import { slides, slides_v1 } from "@googleapis/slides";
import { OAuth2Client } from "google-auth-library";
import { ensureValidToken, getGoogleWorkspaceConfig } from "./auth.js";
import { logger } from "../../config.js";

// ── Create authenticated Slides client ────────────

async function getAuthenticatedSlidesClient(accountName: string) {
    const accessToken = await ensureValidToken(accountName);
    const { clientId, clientSecret, redirectUri } = getGoogleWorkspaceConfig();

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ access_token: accessToken });

    return slides({ version: "v1", auth: oauth2Client });
}

// ── Helper: extract text from slide elements ──

function extractSlideText(page: slides_v1.Schema$Page): string {
    const texts: string[] = [];

    for (const element of page.pageElements || []) {
        if (element.shape?.text) {
            for (const textElement of element.shape.text.textElements || []) {
                if (textElement.textRun?.content) {
                    texts.push(textElement.textRun.content);
                }
            }
        }
        if (element.table) {
            for (const row of element.table.tableRows || []) {
                const cells: string[] = [];
                for (const cell of row.tableCells || []) {
                    if (cell.text) {
                        let cellText = "";
                        for (const te of cell.text.textElements || []) {
                            if (te.textRun?.content) {
                                cellText += te.textRun.content;
                            }
                        }
                        cells.push(cellText.trim());
                    }
                }
                if (cells.length > 0) texts.push(cells.join(" | "));
            }
        }
    }

    return texts.join("").trim();
}

// ── Slides API Operations ─────────────────────────

export interface SlideSummary {
    slideIndex: number;
    objectId: string;
    textContent: string;
}

export async function getPresentation(
    accountName: string,
    presentationId: string
): Promise<{ title: string; slides: SlideSummary[] }> {
    try {
        logger.debug(`[google-slides] Getting presentation ${presentationId} for account "${accountName}"`);

        const client = await getAuthenticatedSlidesClient(accountName);

        const response = await client.presentations.get({
            presentationId,
        });

        const title = response.data.title || "Untitled Presentation";
        const slideList: SlideSummary[] = (response.data.slides || []).map(
            (slide, index) => ({
                slideIndex: index + 1,
                objectId: slide.objectId || "",
                textContent: extractSlideText(slide),
            })
        );

        logger.info(`[google-slides] Presentation read: ${title} (${slideList.length} slides)`);
        return { title, slides: slideList };
    } catch (error) {
        logger.error("[google-slides] Failed to get presentation:", error);
        throw new Error(`Failed to get presentation: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function listSlides(
    accountName: string,
    presentationId: string
): Promise<SlideSummary[]> {
    const presentation = await getPresentation(accountName, presentationId);
    return presentation.slides;
}
