'use client';
/**
 * components/chat/ChatPanel.tsx
 * Full chat interface: message list + input bar.
 */
import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Zap, Code, Globe, Lightbulb, Trash2, Menu } from 'lucide-react';
import { useChatStore, AVAILABLE_MODELS } from '@/store/chatStore';
import { useChat } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const SUGGESTIONS = [
  { icon: Lightbulb, text: 'Explain quantum computing in simple terms' },
  { icon: Code,      text: 'Write a Python function to reverse a linked list' },
  { icon: Globe,     text: 'What are the best travel tips for Tokyo?' },
  { icon: Zap,       text: 'Help me write a professional email to my boss' },
];

export default function ChatPanel() {
  const {
    activeConversationId, conversations, selectedModelId,
    clearConversation, setSidebarOpen, sidebarOpen,
  } = useChatStore();

  const { sendMessage, stopStreaming, isStreaming } = useChat();
  const { speak, stopSpeaking, isSpeaking } = useVoice();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const messages   = activeConv?.messages ?? [];
  const model      = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  const handleSend = useCallback(
    (content: string, imageBase64?: string) => {
      sendMessage(content, imageBase64);
    },
    [sendMessage]
  );

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface-0)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Menu size={16} />
            </button>
          )}
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">
              {activeConv?.title || 'New Chat'}
            </h1>
            {model && (
              <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {model.name}
                <span className="opacity-50">·</span>
                <span className="capitalize opacity-70">{model.provider}</span>
              </p>
            )}
          </div>
        </div>

        {/* Clear button */}
        {messages.length > 0 && (
          <button
            onClick={() => activeConversationId && clearConversation(activeConversationId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear chat"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <EmptyState onSuggestion={handleSuggestion} />
        ) : (
          <div className="pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
                  onSpeak={speak}
                  isSpeaking={isSpeaking}
                  onStopSpeaking={stopSpeaking}
                />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border-subtle)]">
        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full px-6 py-12 text-center"
    >
      <div className="w-14 h-14 brand-bg-gradient rounded-2xl flex items-center justify-center mb-4 shadow-lg">
        <MessageSquare size={24} className="text-white" />
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">How can I help you?</h2>
      <p className="text-sm text-[var(--text-muted)] mb-8 max-w-md">
        Ask anything, upload files for analysis, or try a suggestion below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onSuggestion(s.text)}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-brand-500/40 hover:bg-brand-500/5 text-left transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/20 transition-colors shrink-0">
              <s.icon size={14} />
            </div>
            <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] leading-relaxed transition-colors">
              {s.text}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
