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

  return {
    apiKey,
    modelUrl:
      process.env.HUGGINGFACE_MODEL_URL ||
      "https://router.huggingface.co/fal-ai/models/black-forest-labs/FLUX.1-schnell",
    defaultWidth: parseInt(process.env.IMAGEGEN_DEFAULT_WIDTH || "1024", 10),
    defaultHeight: parseInt(process.env.IMAGEGEN_DEFAULT_HEIGHT || "1024", 10),
  };
}
