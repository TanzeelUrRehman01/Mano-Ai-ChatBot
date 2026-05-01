/**
 * app/api/enhance-prompt/route.ts
 * Uses AI to improve a user's prompt for better image generation results.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ENHANCE_SYSTEM = `You are an expert AI image prompt engineer. 
When given a simple prompt, enhance it with:
- Rich visual details (lighting, atmosphere, style)
- Art style references (photorealistic, oil painting, digital art, etc.)
- Camera/composition details where appropriate
- Quality boosters (4K, highly detailed, masterpiece, etc.)

Keep the enhanced prompt under 200 words. Return ONLY the enhanced prompt, nothing else.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      // Simple rule-based enhancement as fallback
      const enhanced = ruleBasedEnhance(prompt);
      return NextResponse.json({ enhanced });
    }

    const isGroq = !!process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY;
    const url = isGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';
    const model = isGroq
      ? 'llama3-8b-8192'
      : 'mistralai/mistral-7b-instruct:free';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(isGroq ? {} : {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://mano-ai.vercel.app',
          'X-Title': 'Mano AI',
        }),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM },
          { role: 'user', content: `Enhance this image prompt: "${prompt}"` },
        ],
        max_tokens: 300,
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ enhanced: ruleBasedEnhance(prompt) });
    }

    const data = await res.json();
    const enhanced = data.choices?.[0]?.message?.content || ruleBasedEnhance(prompt);
    return NextResponse.json({ enhanced: enhanced.trim() });
  } catch (err) {
    console.error('[enhance-prompt] Error:', err);
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}

// ─── Rule-based fallback ──────────────────────────────────────────────────────
function ruleBasedEnhance(prompt: string): string {
  const styles = ['highly detailed', '4K resolution', 'masterpiece quality', 'professional photography'];
  const lighting = ['dramatic lighting', 'golden hour', 'studio lighting', 'cinematic atmosphere'];
  const quality = ['sharp focus', 'intricate details', 'vibrant colors'];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  return `${prompt}, ${pick(styles)}, ${pick(lighting)}, ${pick(quality)}, award-winning digital art, trending on ArtStation`;
}
