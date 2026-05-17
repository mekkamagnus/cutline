/**
 * Generic OpenAI-Compatible Image Generation Provider
 *
 * Calls POST {endpoint}/images/generations with standard OpenAI format.
 * Works with Google, OpenAI, Black Forest Labs (fal), ByteDance, Alibaba, etc.
 */

export interface OpenAIImageParams {
  prompt: string;
  model: string;
  size?: string;
  n?: number;
  style?: string;
  response_format?: 'url' | 'b64_json';
}

export interface OpenAIImageResult {
  id: string;
  url: string;
  cost: number;
  model: string;
  provider: string;
}

interface OpenAIImageResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  model?: string;
}

const DALL_E_3_SIZES = ['1024x1024', '1024x1792', '1792x1024'];
const GPT_IMAGE_SIZES = ['1536x1024', '1024x1536', '1024x1024'];

function normalizeSize(size: string | undefined, allowed: string[]): string {
  if (size && allowed.includes(size)) return size;

  const match = size?.match(/^(\d+)x(\d+)$/);
  if (!match) return allowed[0]!;

  const width = Number(match[1]);
  const height = Number(match[2]);
  const landscape = allowed.filter((s) => {
    const [w, h] = s.split('x').map(Number);
    return w > h;
  });
  const portrait = allowed.filter((s) => {
    const [w, h] = s.split('x').map(Number);
    return h > w;
  });
  const square = allowed.filter((s) => {
    const [w, h] = s.split('x').map(Number);
    return w === h;
  });

  if (width > height && landscape[0]) return landscape[0];
  if (height > width && portrait[0]) return portrait[0];
  return square[0] ?? allowed[0]!;
}

export async function generateViaOpenAICompat(
  endpoint: string,
  apiKey: string,
  params: OpenAIImageParams,
  costPerImage: number = 0.01,
  providerName: string = 'unknown',
): Promise<OpenAIImageResult> {
  const url = `${endpoint.replace(/\/$/, '')}/images/generations`;
  const isGPTImage = /^gpt-image-/i.test(params.model);
  const isDallE = /^dall-e-/i.test(params.model);

  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    n: params.n ?? 1,
  };

  if (isGPTImage) {
    body.size = normalizeSize(params.size, GPT_IMAGE_SIZES);
    body.quality = 'low';
  } else if (isDallE) {
    body.size = normalizeSize(params.size, DALL_E_3_SIZES);
    body.response_format = params.response_format ?? 'b64_json';
  } else {
    body.response_format = params.response_format ?? 'b64_json';
    if (params.size) {
      body.size = params.size;
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${providerName} API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json() as OpenAIImageResponse;

  const imageData = result.data?.[0];
  if (!imageData) {
    throw new Error(`${providerName}: No image data in response`);
  }

  let imageUrl: string;
  if (imageData.url) {
    imageUrl = imageData.url;
  } else if (imageData.b64_json) {
    imageUrl = `data:image/png;base64,${imageData.b64_json}`;
  } else {
    throw new Error(`${providerName}: No URL or base64 data in response`);
  }

  return {
    id: `${providerName}-${Date.now()}`,
    url: imageUrl,
    cost: costPerImage,
    model: params.model,
    provider: providerName,
  };
}
