// ============================================
// Image Generation - HuggingFace API Wrapper
// Uses node-fetch instead of built-in fetch
// (Node.js 18 undici uses WebAssembly which OOMs on memory-constrained hosts)
// ============================================

import fetch from "node-fetch";
import type { Response } from "node-fetch";
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
      Accept: "*/*",
      "User-Agent": "dancing-dead-mcp/1.0",
    };

    const jsonBody = JSON.stringify(body);

    // node-fetch (unlike built-in fetch/undici) preserves headers across cross-origin redirects,
    // so we let it follow redirects automatically — no manual handling needed.
    const response: Response = await fetch(config.modelUrl, {
      method: "POST",
      headers: requestHeaders,
      body: jsonBody,
      signal: controller.signal as never,
      redirect: "follow",
    });

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
