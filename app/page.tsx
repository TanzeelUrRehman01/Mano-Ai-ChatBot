'use client';
/**
 * app/page.tsx
 * Landing page for Mano AI — hero, features, CTA.
 */
import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageSquare, Image as ImageIcon, Mic, Volume2,
  Paperclip, Brain, Moon, Download, Zap, Shield,
  Github, ArrowRight, Sparkles, CheckCircle2, Globe,
} from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

/* ─── Modern Mano AI Logo ─── */
function ManoLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logo-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {/* Outer rounded square */}
      <rect x="3" y="3" width="34" height="34" rx="10" stroke="url(#logo-grad)" strokeWidth="2.5" fill="none" />
      {/* Stylised "M" / neural path */}
      <path
        d="M11 30V14l9 10 9-10v16"
        stroke="url(#logo-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Top dot — represents the "mind" / AI spark */}
      <circle cx="20" cy="10" r="2.8" fill="url(#logo-grad)" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Streaming Chat',
    desc: 'Real-time AI responses with markdown and code highlighting. Like ChatGPT, but free.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: ImageIcon,
    title: 'Image Generation',
    desc: 'Turn your ideas into stunning images using Pollinations AI. No API key required.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: Mic,
    title: 'Voice Input',
    desc: 'Speak your prompts. Web Speech API brings hands-free interaction.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Volume2,
    title: 'Text to Speech',
    desc: "Let Mano AI read responses aloud. Perfect for multitasking.",
    color: 'from-orange-500 to-amber-600',
  },
  {
    icon: Paperclip,
    title: 'File Analysis',
    desc: 'Upload PDFs and images for AI-powered summarization and analysis.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: Brain,
    title: 'AI Memory',
    desc: 'Mano remembers your name, style preferences, and custom system prompts.',
    color: 'from-rose-500 to-pink-600',
  },
  {
    icon: Moon,
    title: 'Dark / Light Mode',
    desc: 'Beautiful in both. Your preference is saved automatically.',
    color: 'from-slate-500 to-gray-600',
  },
  {
    icon: Download,
    title: 'Export Chats',
    desc: 'Save conversations as PDF or TXT files. Your data stays yours.',
    color: 'from-teal-500 to-green-600',
  },
];

const FREE_APIS = [
  { name: 'OpenRouter',     desc: 'Mistral, LLaMA, Gemma',  badge: 'Free',  color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  { name: 'Groq',           desc: 'Ultra-fast inference',     badge: 'Free',  color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  { name: 'Pollinations AI', desc: 'Image generation',        badge: 'Free',    color: 'bg-green-500/15 text-green-400 border-green-500/20' },
  { name: 'HuggingFace',    desc: 'Stable Diffusion models',  badge: 'Free',  color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
];

export default function LandingPage() {
  const { theme } = useChatStore();

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--surface-0)] overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <ManoLogo className="w-8 h-8" />
          <span className="font-bold text-[var(--text-primary)] text-lg tracking-tight">Mano AI</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com "
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Github size={16} /> GitHub
          </a>
          <Link
            href="/app"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl brand-bg-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            Launch App <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 py-20 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
            <Zap size={14} />
            Zero cost. Maximum capability.
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            <span className="text-[var(--text-primary)]">Your AI</span><br />
            <span className="brand-gradient">Assistant.</span><br />
            <span className="text-[var(--text-primary)]">Completely Free.</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            A complete AI toolkit built with modern 2026 features.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl brand-bg-gradient text-white font-bold text-base hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/25"
            >
              <Sparkles size={18} /> Start Chatting Free
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-[var(--border-default)] text-[var(--text-secondary)] font-semibold text-base hover:border-brand-500/40 hover:text-[var(--text-primary)] transition-all"
            >
              See Features <ArrowRight size={16} />
            </a>
          </div>
        </motion.div>

        {/* App screenshot preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 relative"
        >
          <div className="relative rounded-2xl overflow-hidden border border-[var(--border-default)] shadow-2xl bg-[var(--surface-1)]">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-[var(--text-muted)]">Mano AI — Chat</span>
            </div>
            <div className="p-6 space-y-4 min-h-[200px] flex flex-col justify-center">
              <div className="flex gap-3 justify-end">
                <div className="bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-xs">
                  Explain how streaming AI responses work
                </div>
                <div className="w-8 h-8 bg-[var(--surface-3)] rounded-xl flex-shrink-0" />
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 brand-bg-gradient rounded-xl flex-shrink-0" />
                <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-sm text-[var(--text-primary)]">
                  Streaming AI responses work by sending tokens one by one as they&apos;re generated...
                  <span className="inline-block w-2 h-4 bg-brand-400 rounded animate-pulse ml-1" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Free APIs section */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Powered by Free AI APIs</h2>
          <p className="text-[var(--text-muted)]">Free Tier — no credit card required.</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FREE_APIS.map((api, i) => (
            <motion.div
              key={api.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-center"
            >
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border mb-2 ${api.color}`}>
                {api.badge}
              </span>
              <p className="font-bold text-sm text-[var(--text-primary)]">{api.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{api.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-black text-[var(--text-primary)] mb-3">Everything You Need</h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            A complete AI toolkit built with modern 2026 features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-brand-500/30 hover:bg-brand-500/3 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                <f.icon size={18} className="text-white" />
              </div>
              <h3 className="font-bold text-sm text-[var(--text-primary)] mb-1">{f.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-3xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
        >
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 text-center">
            Modern Tech Stack 
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ['Next.js 14', 'App Router + Edge Runtime'],
              ['React 18', 'Concurrent features'],
              ['Tailwind CSS', 'Utility-first styling'],
              ['Framer Motion', 'Smooth animations'],
              ['Zustand', 'Lightweight state'],
              ['TypeScript', 'Full type safety'],
            ].map(([name, desc]) => (
              <div key={name} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-black text-[var(--text-primary)] mb-4">
            Ready to explore?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
            No signup. No credit card. Just open the app and start building.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl brand-bg-gradient text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-xl shadow-brand-500/25"
          >
            <Zap size={20} /> Open Mano AI
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-[var(--border-subtle)] text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ManoLogo className="w-4 h-4" />
          <span className="text-xs text-[var(--text-muted)]">Crafted by Tanzeel ur Rehman</span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Powered by Mano AI Web &copy; {new Date().getFullYear()} 
        </p>
      </footer>
    </div>
  );
}