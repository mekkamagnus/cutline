/**
 * Google-native Image Generation Provider
 *
 * Uses POST /v1beta/models/{model}:generateContent with responseModalities: ["IMAGE"].
 * Different from OpenAI /images/generations — Google uses x-goog-api-key header
 * and returns images as inline_data parts (base64).
 */

export interface GoogleImageResult {
  id: string;
  url: string;
  cost: number;
  model: string;
  provider: string;
}

interface GoogleGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

export async function generateViaGoogleAI(
  apiKey: string,
  model: string,
  prompt: string,
  aspectRatio: string = '16:9',
  costPerImage: number = 0.02,
): Promise<GoogleImageResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json() as GoogleGenerateContentResponse;

  const parts = result.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error('Google API: No content parts in response');
  }

  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart?.inlineData) {
    throw new Error('Google API: No image data in response');
  }

  const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

  return {
    id: `google-${Date.now()}`,
    url: dataUrl,
    cost: costPerImage,
    model,
    provider: 'google',
  };
}
