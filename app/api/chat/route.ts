/**
 * app/api/chat/route.ts
 * Streaming chat API route.
 * Supports OpenRouter (free models) and Groq (fast free tier).
 * Never exposes API keys to the frontend.
 */
import { NextRequest } from 'next/server';

export const runtime = 'edge'; // Edge runtime for fast streaming

// ─── Helpers ──────────────────────────────────────────────────────────────────
function errorStream(message: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, modelId, systemPrompt } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return errorStream('Invalid messages array');
    }

    // Determine provider from model ID
    const isGroq = !modelId.includes('/') && !modelId.includes(':');
    const provider = isGroq ? 'groq' : 'openrouter';

    const apiKey = isGroq
      ? process.env.GROQ_API_KEY
      : process.env.OPENROUTER_API_KEY;

    // Fallback: use Pollinations chat if no keys configured
    if (!apiKey) {
      return handlePollinationsChat(messages, modelId);
    }

    const baseUrl = isGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    // Build messages with optional system prompt
    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    // OpenRouter requires these headers
    if (!isGroq) {
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://mano-ai.vercel.app';
      headers['X-Title'] = 'Mano AI';
    }

    let upstream = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId,
        messages: fullMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    // If model not found (404), try fallback model
    if (upstream.status === 404 && !isGroq) {
      console.warn(`[openrouter] Model ${modelId} not found, trying fallback...`);
      // Try with auto model which routes to fastest available
      upstream = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: fullMessages,
          stream: true,
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });
    }

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error(`[${provider}] API error:`, errText);
      // Try fallback on API error
      return handlePollinationsChat(messages, modelId);
    }

    // Stream the response back
    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[chat route] Error:', err);
    return errorStream('Something went wrong. Please try again.');
  }
}

// ─── Pollinations Text Fallback (no key needed) ───────────────────────────────
async function handlePollinationsChat(
  messages: Array<{ role: string; content: string }>,
  _modelId: string
) {
  const encoder = new TextEncoder();

  // Build a simple prompt from messages
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return errorStream('No user message found');

  try {
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(lastUser.content)}`,
      { method: 'GET' }
    );

    if (!res.ok) return errorStream('AI service unavailable. Please add an API key in settings.');

    const text = await res.text();

    // Simulate streaming by chunking the response
    const stream = new ReadableStream({
      async start(controller) {
        const words = text.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + ' ';
          const data = JSON.stringify({
            choices: [{ delta: { content: chunk } }],
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          // Small delay to simulate streaming
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch {
    return errorStream('All AI providers unavailable. Please check your API keys.');
  }
}
