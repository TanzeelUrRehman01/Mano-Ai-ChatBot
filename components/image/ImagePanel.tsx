'use client';
/**
 * components/image/ImagePanel.tsx
 * Full image generation interface.
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Wand2, Download, Trash2, ChevronDown,
  ChevronUp, Loader2, ImageOff, RefreshCw, Copy, Check,
  Settings2,
} from 'lucide-react';
import { useImageGen, IMAGE_MODELS, IMAGE_SIZES, type GeneratedImage } from '@/hooks/useImageGen';
import { cn, copyToClipboard, randomSeed } from '@/utils/helpers';

export default function ImagePanel() {
  const { images, isLoading, error, progress, generateImage, enhancePrompt, removeImage, clearImages } =
    useImageGen();

  const [prompt, setPrompt]             = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSize, setSelectedSize] = useState(0);
  const [selectedModel, setSelectedModel] = useState('flux');
  const [seed, setSeed]                 = useState<number | undefined>();
  const [useEnhanced, setUseEnhanced]   = useState(false);

  const handleEnhance = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    const enhanced = await enhancePrompt(prompt);
    setEnhancedPrompt(enhanced);
    setUseEnhanced(true);
    setIsEnhancing(false);
  }, [prompt, enhancePrompt]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    const size = IMAGE_SIZES[selectedSize];
    await generateImage(prompt, {
      width:    size.width,
      height:   size.height,
      model:    selectedModel,
      provider: 'pollinations',
      enhancedPrompt: useEnhanced ? enhancedPrompt : undefined,
      seed,
    });
  }, [prompt, selectedSize, selectedModel, useEnhanced, enhancedPrompt, seed, generateImage]);

  const handleRandomSeed = () => setSeed(randomSeed());
  const clearSeed        = () => setSeed(undefined);

  return (
    <div className="flex flex-col h-full bg-[var(--surface-0)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm">
        <div>
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Image Generator</h1>
          <p className="text-[11px] text-[var(--text-muted)]">Powered by Pollinations AI • Free • No key needed</p>
        </div>
        {images.length > 0 && (
          <button
            onClick={clearImages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} /> Clear All
          </button>
        )}
      </div>

      {/* Gallery */}
      <div className="flex-1 overflow-y-auto">
        {images.length === 0 && !isLoading ? (
          <EmptyImageState />
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {/* Loading card */}
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="aspect-square rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] flex flex-col items-center justify-center gap-3"
                >
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 brand-bg-gradient rounded-full opacity-20 animate-ping" />
                    <div className="relative w-14 h-14 brand-bg-gradient rounded-full flex items-center justify-center">
                      <Loader2 size={22} className="text-white animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Generating...</p>
                    <p className="text-xs text-[var(--text-muted)]">{progress}%</p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-32 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full brand-bg-gradient"
                      style={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Generated images */}
              {images.map((img) => (
                <ImageCard key={img.id} image={img} onRemove={removeImage} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Prompt area */}
      <div className="border-t border-[var(--border-subtle)] p-4 space-y-3 bg-[var(--surface-1)]/60">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400"
            >
              <ImageOff size={13} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced prompt preview */}
        <AnimatePresence>
          {enhancedPrompt && useEnhanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 py-2.5 bg-brand-500/8 border border-brand-500/20 rounded-xl"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} /> Enhanced Prompt
                </span>
                <button onClick={() => setUseEnhanced(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[10px]">
                  Use original
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{enhancedPrompt}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-3 overflow-hidden"
            >
              {/* Size */}
              <div>
                <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1 block">Size</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(Number(e.target.value))}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500 cursor-pointer"
                >
                  {IMAGE_SIZES.map((s, i) => (
                    <option key={i} value={i}>{s.label} ({s.width}×{s.height})</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1 block">Style</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500 cursor-pointer"
                >
                  {IMAGE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
                  ))}
                </select>
              </div>

              {/* Seed */}
              <div className="col-span-2">
                <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1 block">
                  Seed (optional — for reproducible results)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Random"
                    value={seed ?? ''}
                    onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
                    className="flex-1 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                  <button onClick={handleRandomSeed} className="px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs hover:border-brand-500/40 transition-colors" title="Random seed">
                    <RefreshCw size={12} />
                  </button>
                  {seed && (
                    <button onClick={clearSeed} className="px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs hover:border-red-500/40 transition-colors" title="Clear seed">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt textarea */}
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            placeholder="Describe the image you want to create..."
            rows={2}
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-brand-500 transition-colors placeholder-[var(--text-muted)]"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5',
              showSettings
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
            )}
          >
            <Settings2 size={14} />
            {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Enhance prompt */}
          <button
            onClick={handleEnhance}
            disabled={!prompt.trim() || isEnhancing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-500/30 text-brand-400 hover:bg-brand-500/10 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEnhancing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            Enhance
          </button>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl brand-bg-gradient text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 shadow-sm"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────
function ImageCard({ image, onRemove }: { image: GeneratedImage; onRemove: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      
      // Ensure proper image mime type
      const mimeType = blob.type || 'image/png';
      const safeBlob = new Blob([blob], { type: mimeType });
      
      const url = URL.createObjectURL(safeBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename from prompt (sanitized)
      const promptSnippet = (image.enhancedPrompt || image.prompt)
        .substring(0, 40)
        .replace(/[^a-z0-9\s-]/gi, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
      
      a.download = `mano-ai-${promptSnippet || 'image'}-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      // Open in new tab as fallback
      window.open(image.url, '_blank');
    }
  };

  const handleCopyUrl = async () => {
    await copyToClipboard(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative rounded-2xl overflow-hidden bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-brand-500/30 transition-all hover:shadow-lg"
    >
      {/* Image */}
      <div className="aspect-square relative">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
            <ImageOff size={32} className="opacity-40" />
            <p className="text-xs opacity-60">Failed to load</p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.prompt}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-xs mb-2 line-clamp-2 leading-relaxed">{image.enhancedPrompt || image.prompt}</p>
          <div className="flex gap-1.5">
            <button onClick={handleDownload} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs backdrop-blur-sm transition-colors">
              <Download size={11} /> Save
            </button>
            <button onClick={handleCopyUrl} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs backdrop-blur-sm transition-colors">
              {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied' : 'URL'}
            </button>
            <button onClick={() => onRemove(image.id)} className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-white text-xs backdrop-blur-sm transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Model badge */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] backdrop-blur-sm">
          {image.model}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyImageState() {
  const EXAMPLES = [
    'A futuristic city at sunset with flying cars',
    'A cozy library with magical floating books',
    'Abstract digital art with neon colors',
    'A cute robot painting a landscape',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full px-6 py-12 text-center"
    >
      <div className="w-14 h-14 brand-bg-gradient rounded-2xl flex items-center justify-center mb-4 shadow-lg">
        <Sparkles size={24} className="text-white" />
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Create AI Images</h2>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md">
        Describe anything and watch Mano AI bring it to life using Pollinations AI — completely free.
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {EXAMPLES.map((ex, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            {ex}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
