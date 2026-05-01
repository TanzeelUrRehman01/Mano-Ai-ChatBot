'use client';
/**
 * hooks/useImageGen.ts
 * Hook for image generation with Pollinations AI and HuggingFace.
 */
import { useState, useCallback } from 'react';
import { randomSeed } from '@/utils/helpers';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  width: number;
  height: number;
  model: string;
  provider: string;
  seed: number;
  createdAt: number;
}

export const IMAGE_MODELS = [
  { id: 'flux',        name: 'Flux',        description: 'High quality (default)' },
  { id: 'turbo',       name: 'Flux Turbo',  description: 'Fast generation' },
  { id: 'flux-realism', name: 'Flux Realism', description: 'Photorealistic' },
  { id: 'flux-anime',  name: 'Flux Anime',  description: 'Anime / manga style' },
  { id: 'flux-3d',     name: 'Flux 3D',     description: '3D rendered style' },
];

export const IMAGE_SIZES = [
  { label: 'Square (1:1)',    width: 1024, height: 1024 },
  { label: 'Portrait (2:3)',  width: 832,  height: 1216 },
  { label: 'Landscape (3:2)', width: 1216, height: 832  },
  { label: 'Wide (16:9)',     width: 1344, height: 768  },
];

export function useImageGen() {
  const [images, setImages]       = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [progress, setProgress]   = useState(0);

  const generateImage = useCallback(
    async (
      prompt: string,
      options: {
        width?: number;
        height?: number;
        model?: string;
        provider?: string;
        enhancedPrompt?: string;
        seed?: number;
      } = {}
    ) => {
      if (!prompt.trim()) return;
      setIsLoading(true);
      setError(null);
      setProgress(10);

      const seed = options.seed ?? randomSeed();

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((p) => Math.min(p + 15, 85));
        }, 600);

        const res = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: options.enhancedPrompt || prompt,
            width:    options.width    ?? 1024,
            height:   options.height   ?? 1024,
            model:    options.model    ?? 'flux',
            provider: options.provider ?? 'pollinations',
            seed,
          }),
        });

        clearInterval(progressInterval);
        setProgress(95);

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Image generation failed');
        }

        const data = await res.json();
        setProgress(100);

        const newImage: GeneratedImage = {
          id: `img-${Date.now()}`,
          url: data.imageUrl,
          prompt,
          enhancedPrompt: options.enhancedPrompt,
          width:    options.width  ?? 1024,
          height:   options.height ?? 1024,
          model:    data.model     ?? options.model ?? 'flux',
          provider: data.provider  ?? 'pollinations',
          seed,
          createdAt: Date.now(),
        };

        setImages((prev) => [newImage, ...prev]);
        return newImage;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      } finally {
        setIsLoading(false);
        setTimeout(() => setProgress(0), 500);
      }
    },
    []
  );

  const enhancePrompt = useCallback(async (prompt: string): Promise<string> => {
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) return prompt;
      const data = await res.json();
      return data.enhanced || prompt;
    } catch {
      return prompt;
    }
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearImages = useCallback(() => setImages([]), []);

  return {
    images,
    isLoading,
    error,
    progress,
    generateImage,
    enhancePrompt,
    removeImage,
    clearImages,
  };
}
