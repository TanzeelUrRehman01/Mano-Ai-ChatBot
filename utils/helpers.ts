/**
 * utils/helpers.ts
 * Shared utility functions used across the app.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a timestamp to a readable relative time */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);

  if (minutes < 1)   return 'just now';
  if (minutes < 60)  return `${minutes}m ago`;
  if (hours < 24)    return `${hours}h ago`;
  if (days < 7)      return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/** Truncate a string to a max length */
export function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 3) + '...';
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    return success;
  }
}

/** Parse streaming SSE data */
export function parseSSELine(line: string): string | null {
  if (!line.startsWith('data: ')) return null;
  const data = line.slice(6);
  if (data === '[DONE]') return null;
  try {
    const json = JSON.parse(data);
    return json.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

/** Build a Pollinations image URL */
export function buildPollinationsUrl(
  prompt: string,
  options: { width?: number; height?: number; model?: string; seed?: number } = {}
): string {
  const { width = 1024, height = 1024, model = 'flux', seed } = options;
  const encoded = encodeURIComponent(prompt);
  const seedParam = seed ? `&seed=${seed}` : '';
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${model}&nologo=true${seedParam}`;
}

/** Random seed for image generation */
export function randomSeed(): number {
  return Math.floor(Math.random() * 999999);
}

/** Extract code language from fenced block */
export function detectLanguage(code: string): string {
  if (code.startsWith('import ') || code.includes('from '))  return 'python';
  if (code.includes('function ') || code.includes('const ')) return 'javascript';
  if (code.includes('<html') || code.includes('<!DOCTYPE'))  return 'html';
  if (code.includes('SELECT ') || code.includes('FROM '))    return 'sql';
  return 'text';
}
