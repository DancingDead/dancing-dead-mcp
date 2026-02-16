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

    // node-fetch follows redirects by default and preserves headers (unlike built-in fetch/undici)
    // We still use manual redirect to rewrite deprecated api-inference URLs
    let response: Response = await fetch(config.modelUrl, {
      method: "POST",
      headers: requestHeaders,
      body: jsonBody,
      signal: controller.signal as never,
      redirect: "manual",
    });

    // Handle redirects manually (HuggingFace router may redirect to deprecated api-inference)
    if (response.status >= 300 && response.status < 400) {
      let location = response.headers.get("Location");
      if (location) {
        // If redirected to deprecated api-inference, rewrite URL back to router
        if (location.includes("api-inference.huggingface.co")) {
          const url = new URL(location);
          url.hostname = "router.huggingface.co";
          url.pathname = "/hf-inference" + url.pathname;
          location = url.toString();
          logger.info(`[image-gen] Rewritten deprecated redirect to: ${location}`);
        } else {
          logger.info(`[image-gen] Redirected to: ${location}`);
        }
        response = await fetch(location, {
          method: "POST",
          headers: requestHeaders,
          body: jsonBody,
          signal: controller.signal as never,
          redirect: "manual",
        });
        // Handle second-level redirect if needed
        if (response.status >= 300 && response.status < 400) {
          const loc2 = response.headers.get("Location");
          if (loc2) {
            logger.info(`[image-gen] Second redirect to: ${loc2}`);
            response = await fetch(loc2, {
              method: "POST",
              headers: requestHeaders,
              body: jsonBody,
              signal: controller.signal as never,
            });
          }
        }
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
