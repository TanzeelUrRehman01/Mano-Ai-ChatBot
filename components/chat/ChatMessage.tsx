'use client';
/**
 * components/chat/ChatMessage.tsx
 * Renders a single chat message with markdown, code highlighting, copy button, TTS.
 */
import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { Copy, Check, Volume2, VolumeX, User, Bot, AlertCircle } from 'lucide-react';
import { cn, copyToClipboard } from '@/utils/helpers';
import type { Message } from '@/store/chatStore';

interface Props {
  message: Message;
  isStreaming?: boolean;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
}

export default function ChatMessage({ message, isStreaming, onSpeak, isSpeaking, onStopSpeaking }: Props) {
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const isUser = message.role === 'user';
  const isEmpty = !message.content && isStreaming;

  const handleCopyMessage = useCallback(async () => {
    const ok = await copyToClipboard(message.content);
    if (ok) {
      setCopiedMsgId(message.id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  }, [message]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('group flex gap-3 px-4 py-4', isUser ? 'justify-end' : 'justify-start')}
    >
      {/* Avatar — AI */}
      {!isUser && (
        <div className="shrink-0 w-8 h-8 brand-bg-gradient rounded-xl flex items-center justify-center mt-0.5 shadow-sm">
          <Bot size={15} className="text-white" />
        </div>
      )}

      {/* Bubble */}
      <div className={cn('max-w-[85%] md:max-w-[75%] space-y-1', isUser ? 'items-end' : 'items-start', 'flex flex-col')}>
        {/* Message content */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'bg-brand-500 text-white rounded-tr-sm'
              : 'bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-sm',
            message.error && 'border-red-500/30 bg-red-500/5'
          )}
        >
          {/* Uploaded image preview */}
          {message.imageUrl && message.role === 'user' && (
            <img
              src={message.imageUrl}
              alt="Uploaded"
              className="max-w-xs rounded-lg mb-2"
            />
          )}

          {/* Error icon */}
          {message.error && (
            <div className="flex items-center gap-1.5 text-red-400 mb-1 text-xs">
              <AlertCircle size={13} /> Error
            </div>
          )}

          {isEmpty ? (
            /* Typing indicator */
            <div className="flex items-center gap-1.5 py-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="typing-dot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom code renderer with copy button
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const lang   = match?.[1] || 'text';
                    const code   = String(children).replace(/\n$/, '');
                    const isBlock = code.includes('\n') || !!match;

                    if (!isBlock) {
                      return <code className={className} {...props}>{children}</code>;
                    }

                    return <CodeBlock code={code} lang={lang} />;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-brand-400 rounded-sm animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {/* Actions row */}
        {!isUser && message.content && !isStreaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Copy message */}
            <ActionButton
              onClick={handleCopyMessage}
              title={copiedMsgId === message.id ? 'Copied!' : 'Copy'}
              active={copiedMsgId === message.id}
            >
              {copiedMsgId === message.id ? <Check size={12} /> : <Copy size={12} />}
            </ActionButton>

            {/* TTS */}
            {onSpeak && (
              <ActionButton
                onClick={() => isSpeaking ? onStopSpeaking?.() : onSpeak(message.content)}
                title={isSpeaking ? 'Stop' : 'Read aloud'}
                active={isSpeaking}
              >
                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </ActionButton>
            )}

            {/* Timestamp */}
            <span className="text-[10px] text-[var(--text-muted)] ml-1">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* Avatar — User */}
      {isUser && (
        <div className="shrink-0 w-8 h-8 bg-[var(--surface-3)] rounded-xl flex items-center justify-center mt-0.5 border border-[var(--border-subtle)]">
          <User size={15} className="text-[var(--text-muted)]" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper my-3">
      <div className="code-block-header">
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 10px 10px',
          fontSize: '0.8125rem',
          padding: '1rem',
          background: '#0f0f1a',
        }}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionButton({
  children, onClick, title, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded-lg text-[var(--text-muted)] transition-colors',
        active
          ? 'bg-brand-500/15 text-brand-400'
          : 'hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
      )}
    >
      {children}
    </button>
  );
}
