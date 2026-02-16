// ============================================
// Image Generation - Configuration
// ============================================

export interface ImageGenConfig {
  apiKey: string;
  modelUrl: string;
  defaultWidth: number;
  defaultHeight: number;
}

export function getImageGenConfig(): ImageGenConfig {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY must be set in .env");
  }

  let modelUrl =
    process.env.HUGGINGFACE_MODEL_URL ||
    "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

  // Auto-correct deprecated api-inference.huggingface.co URLs
  if (modelUrl.includes("api-inference.huggingface.co")) {
    const url = new URL(modelUrl);
    url.hostname = "router.huggingface.co";
    url.pathname = "/hf-inference" + url.pathname;
    modelUrl = url.toString();
  }

  return {
    apiKey,
    modelUrl,
    defaultWidth: parseInt(process.env.IMAGEGEN_DEFAULT_WIDTH || "1024", 10),
    defaultHeight: parseInt(process.env.IMAGEGEN_DEFAULT_HEIGHT || "1024", 10),
  };
}
