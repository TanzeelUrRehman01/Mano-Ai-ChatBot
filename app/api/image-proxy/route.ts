/**
 * app/api/image-proxy/route.ts
 * Vercel-safe image proxy with caching + CORS support
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Simple in-memory cache (resets on server restart) ───
const imageCache = new Map<
  string,
  { buffer: Uint8Array; contentType: string; timestamp: number }
>();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const runtime = "nodejs";

// ─── GET /api/image-proxy ───────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const key = searchParams.get("key");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // ─── CHECK CACHE ───
    if (key && imageCache.has(key)) {
      const cached = imageCache.get(key)!;

      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return new NextResponse(cached.buffer, {
          headers: {
            "Content-Type": cached.contentType,
            "Cache-Control": "public, max-age=31536000",
            "Access-Control-Allow-Origin": "*",
            "X-Cache": "HIT",
          },
        });
      }

      imageCache.delete(key);
    }

    // ─── FETCH IMAGE ───
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get("content-type") || "image/png";

    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // ─── STORE CACHE ───
    if (key) {
      imageCache.set(key, {
        buffer,
        contentType,
        timestamp: Date.now(),
      });
    }

    // ─── RETURN IMAGE ───
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "X-Cache": "MISS",
      },
    });

  } catch (err) {
    console.error("[image-proxy] Error:", err);

    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 }
    );
  }
}

// ─── OPTIONS (CORS preflight) ───────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}