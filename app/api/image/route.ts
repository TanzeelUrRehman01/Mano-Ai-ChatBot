/**
 * app/api/image/route.ts
 * Image generation API route.
 * Primary: Pollinations AI (free, no key needed)
 * Fallback: HuggingFace Inference API (free tier)
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const HF_MODELS = [
  'stabilityai/stable-diffusion-xl-base-1.0',
  'runwayml/stable-diffusion-v1-5',
  'CompVis/stable-diffusion-v1-4',
];

// ─── POST /api/image ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024, model = 'flux', provider = 'pollinations', seed } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (provider === 'huggingface') {
      return generateHuggingFace(prompt, width, height);
    }

    // Default: Pollinations (no key needed)
    return generatePollinations(prompt, width, height, model, seed);
  } catch (err) {
    console.error('[image route] Error:', err);
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }
}

// ─── Pollinations Generator ───────────────────────────────────────────────────
async function generatePollinations(
  prompt: string,
  width: number,
  height: number,
  model: string,
  seed?: number
) {
  const seedParam = seed ? `&seed=${seed}` : `&seed=${Math.floor(Math.random() * 999999)}`;
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&nologo=true${seedParam}&enhance=false`;

  // Generate a unique key for this image for caching
  const imageKey = `${encodeURIComponent(prompt)}-${width}-${height}-${model}-${seedParam}`.slice(0, 100);

  // Return a proxied URL that goes through our /api/image-proxy endpoint
  const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(pollUrl)}&key=${imageKey}`;

  return NextResponse.json({
    imageUrl: proxyUrl,
    originalUrl: pollUrl,
    provider: 'pollinations',
    prompt,
    width,
    height,
    model,
  });
}

// ─── HuggingFace Generator ────────────────────────────────────────────────────
async function generateHuggingFace(prompt: string, width: number, height: number) {
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  if (!hfKey) {
    // Fall back to Pollinations
    return generatePollinations(prompt, width, height, 'flux', undefined);
  }

  for (const modelId of HF_MODELS) {
    try {
      const res = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hfKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { width, height, num_inference_steps: 30 },
          }),
        }
      );

      if (res.ok) {
        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        return NextResponse.json({
          imageUrl: dataUrl,
          provider: 'huggingface',
          model: modelId,
          prompt,
        });
      }
    } catch {
      // Try next model
      continue;
    }
  }

  // All HF models failed, fall back to Pollinations
  return generatePollinations(prompt, width, height, 'flux', undefined);
}
