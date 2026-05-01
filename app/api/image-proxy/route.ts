/**
 * app/api/image-proxy/route.ts
 * Proxy endpoint for loading images from Pollinations AI with CORS support.
 * This allows frontend to load and download images without CORS issues.
 * Includes request queuing to handle rate limiting gracefully.
 */
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for generated images (resets on server restart)
const imageCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Request queue to handle rate limiting
interface QueuedRequest {
  url: string;
  key: string | null;
  resolve: (value: NextResponse) => void;
  reject: (reason?: any) => void;
}

const requestQueue: QueuedRequest[] = [];
let isProcessing = false;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests to avoid 429

export const runtime = 'nodejs';

// Process queue with rate limiting
async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (!request) break;
    
    try {
      const response = await fetchImageWithRetry(request.url, request.key);
      request.resolve(response);
    } catch (err) {
      request.reject(err);
    }
    
    // Wait before next request
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL));
  }
  
  isProcessing = false;
}

// Fetch with retry logic for 429 errors
async function fetchImageWithRetry(url: string, key: string | null, attempt = 1): Promise<NextResponse> {
  // Check cache first
  if (key && imageCache.has(key)) {
    const cached = imageCache.get(key)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return new NextResponse(cached.buffer, {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT',
        },
      });
    } else {
      imageCache.delete(key);
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Handle 429 (rate limit) with exponential backoff
    if (response.status === 429 && attempt < 3) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
      const delayMs = Math.min(retryAfter * 1000 * attempt, 10000);
      console.warn(`[image-proxy] Rate limited, retrying in ${delayMs}ms (attempt ${attempt})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchImageWithRetry(url, key, attempt + 1);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();
    const bufferNode = Buffer.from(buffer);

    // Cache the image
    if (key) {
      imageCache.set(key, {
        buffer: bufferNode,
        contentType,
        timestamp: Date.now(),
      });
    }

    return new NextResponse(bufferNode, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('[image-proxy] Fetch error:', err);
    throw err;
  }
}

// ─── GET /api/image-proxy ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const key = searchParams.get('key');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Queue the request and wait for response
    return new Promise((resolve, reject) => {
      requestQueue.push({ url, key, resolve, reject });
      processQueue();
    });
  } catch (err) {
    console.error('[image-proxy] Error:', err);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}

// ─── OPTIONS /api/image-proxy (CORS preflight) ──────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
