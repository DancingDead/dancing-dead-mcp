// ============================================
// Image Generation - HuggingFace API Wrapper
// ============================================

import { getImageGenConfig } from "./config.js";
import { logger } from "../../config.js";

export interface GenerateImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  seed?: number;
}

export interface GenerateImageResult {
  base64: string;
  mimeType: string;
  prompt: string;
  byteLength: number;
}

export async function generateImage(
  options: GenerateImageOptions,
): Promise<GenerateImageResult> {
  const config = getImageGenConfig();

  const body: Record<string, unknown> = {
    inputs: options.prompt,
  };

  const parameters: Record<string, unknown> = {};
  if (options.width) parameters.width = options.width;
  if (options.height) parameters.height = options.height;
  if (options.num_inference_steps)
    parameters.num_inference_steps = options.num_inference_steps;
  if (options.seed !== undefined) parameters.seed = options.seed;

  if (Object.keys(parameters).length > 0) {
    body.parameters = parameters;
  }

  logger.info(`[image-gen] Generating image with model: ${config.modelUrl}`);
  logger.info(`[image-gen] Prompt: "${options.prompt}"`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const requestHeaders: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };

    // First request — follow redirects manually to re-attach auth header
    let response = await fetch(config.modelUrl, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: "manual",
    });

    // Handle redirects manually (HuggingFace router may redirect)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      if (location) {
        logger.info(`[image-gen] Redirected to: ${location}`);
        response = await fetch(location, {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      }
    }

    logger.info(`[image-gen] Response status: ${response.status}, url: ${response.url}`);

    if (!response.ok) {
      let errorMsg: string;
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const errorJson = (await response.json()) as { error?: string };
        errorMsg = errorJson.error || response.statusText;
      } else {
        errorMsg = await response.text();
      }
      throw new Error(`HuggingFace API ${response.status}: ${errorMsg}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const responseMimeType = response.headers.get("Content-Type") || "image/png";
    const mimeType = responseMimeType.split(";")[0].trim();

    logger.info(
      `[image-gen] Image generated: ${buffer.length} bytes, type: ${mimeType}`,
    );

    return {
      base64,
      mimeType,
      prompt: options.prompt,
      byteLength: buffer.length,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
