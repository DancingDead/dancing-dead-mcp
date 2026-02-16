// ============================================
// Image Generation - MCP Tool Definitions
// ============================================

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateImage, formatError } from "./api.js";
import { getImageGenConfig } from "./config.js";

export function registerImageGenTools(mcpServer: McpServer): void {
  // ── generate-image ────────────────────────────

  mcpServer.tool(
    "generate-image",
    "Generate an image from a text prompt using AI (FLUX / HuggingFace). Returns the image for inline display.",
    {
      prompt: z.string().describe("Text description of the image to generate"),
      width: z
        .number()
        .int()
        .min(256)
        .max(2048)
        .optional()
        .describe("Image width in pixels (default 1024)"),
      height: z
        .number()
        .int()
        .min(256)
        .max(2048)
        .optional()
        .describe("Image height in pixels (default 1024)"),
      num_inference_steps: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of inference steps (higher = better quality, slower)"),
      seed: z
        .number()
        .int()
        .optional()
        .describe("Random seed for reproducible results"),
    },
    async (params) => {
      try {
        const config = getImageGenConfig();
        const result = await generateImage({
          prompt: params.prompt,
          width: params.width ?? config.defaultWidth,
          height: params.height ?? config.defaultHeight,
          num_inference_steps: params.num_inference_steps,
          seed: params.seed,
        });

        return {
          content: [
            {
              type: "image",
              data: result.base64,
              mimeType: result.mimeType,
            },
            {
              type: "text",
              text: `Image generated (${result.byteLength} bytes, ${result.mimeType})\nPrompt: "${result.prompt}"`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Image generation failed: ${formatError(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ── image-gen-info ────────────────────────────

  mcpServer.tool(
    "image-gen-info",
    "Returns current image generation configuration (model URL, default dimensions)",
    {},
    async () => {
      try {
        const config = getImageGenConfig();
        const info = {
          modelUrl: config.modelUrl,
          defaultWidth: config.defaultWidth,
          defaultHeight: config.defaultHeight,
        };
        return {
          content: [
            { type: "text", text: JSON.stringify(info, null, 2) },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to read config: ${formatError(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
