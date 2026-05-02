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

export async function generateViaOpenAICompat(
  endpoint: string,
  apiKey: string,
  params: OpenAIImageParams,
  costPerImage: number = 0.01,
  providerName: string = 'unknown',
): Promise<OpenAIImageResult> {
  const url = `${endpoint.replace(/\/$/, '')}/images/generations`;

  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    n: params.n ?? 1,
    response_format: params.response_format ?? 'b64_json',
  };

  if (params.size) {
    body.size = params.size;
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

/**
 * Mock implementation for development — returns placeholder images.
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash).toString(36);
}

export async function mockGenerate(
  params: OpenAIImageParams,
  providerName: string = 'mock',
  costPerImage: number = 0.01,
): Promise<OpenAIImageResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const seed = hashString(params.prompt);

  return {
    id: `mock-${providerName}-${seed}`,
    url: `https://picsum.photos/seed/${seed}/1024/576`,
    cost: costPerImage,
    model: params.model,
    provider: providerName,
  };
}
