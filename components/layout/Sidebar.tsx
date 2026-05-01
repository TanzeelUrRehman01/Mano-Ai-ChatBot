'use client';
/**
 * components/layout/Sidebar.tsx
 * Left sidebar: conversation list, model selector, new chat button.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, Trash2, Edit3, Check, X,
  ChevronLeft, Bot, Sparkles, Moon, Sun, Settings,
  Image as ImageIcon, Download, FileText,
} from 'lucide-react';
import { useChatStore, AVAILABLE_MODELS } from '@/store/chatStore';
import { cn, formatRelativeTime } from '@/utils/helpers';
import { exportAsTxt, exportAsPdf } from '@/lib/exportChat';

interface SidebarProps {
  activeTab: 'chat' | 'image';
  onTabChange: (tab: 'chat' | 'image') => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const {
    conversations, activeConversationId, selectedModelId,
    sidebarOpen, theme,
    setActiveConversation, createConversation, deleteConversation,
    renameConversation, setSelectedModel, toggleTheme, setSidebarOpen,
  } = useChatStore();

  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport]     = useState<string | null>(null);

  const handleNewChat = () => {
    createConversation();
    onTabChange('chat');
  };

  const handleRenameStart = (id: string, title: string) => {
    setRenamingId(id);
    setRenameValue(title);
  };

  const handleRenameConfirm = () => {
    if (renamingId && renameValue.trim()) {
      renameConversation(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleExport = async (convId: string, format: 'txt' | 'pdf') => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    if (format === 'txt') exportAsTxt(conv);
    else await exportAsPdf(conv);
    setShowExport(null);
  };

  if (!sidebarOpen) {
    return (
      <motion.div
        initial={{ width: 0 }} animate={{ width: 52 }}
        className="hidden md:flex flex-col items-center py-4 gap-4 border-r border-[var(--border-subtle)] bg-[var(--surface-1)]"
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Open sidebar"
        >
          <Bot size={20} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.aside
      initial={{ x: -280 }} animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full bg-[var(--surface-1)] border-r border-[var(--border-subtle)] w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 brand-bg-gradient rounded-lg flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <span className="font-bold text-[var(--text-primary)] text-sm">Mano AI</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors hidden md:flex"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="p-3">
        <div className="flex rounded-xl bg-[var(--surface-2)] p-1 gap-1">
          {(['chat', 'image'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === tab
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {tab === 'chat' ? <MessageSquare size={13} /> : <ImageIcon size={13} />}
              {tab === 'chat' ? 'Chat' : 'Images'}
            </button>
          ))}
        </div>
      </div>

      {/* New Chat button */}
      <div className="px-3 pb-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {/* Model Selector */}
      <div className="px-3 pb-3">
        <select
          value={selectedModelId}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
        >
          <optgroup label="OpenRouter (Free)">
            {AVAILABLE_MODELS.filter((m) => m.provider === 'openrouter').map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </optgroup>
          <optgroup label="Groq (Fast)">
            {AVAILABLE_MODELS.filter((m) => m.provider === 'groq').map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-xs">
            <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
            No conversations yet.<br />Start a new chat!
          </div>
        ) : (
          <AnimatePresence>
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm',
                  conv.id === activeConversationId
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
                )}
                onClick={() => { setActiveConversation(conv.id); onTabChange('chat'); }}
              >
                <MessageSquare size={13} className="shrink-0 opacity-60" />

                {renamingId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameConfirm(); if (e.key === 'Escape') setRenamingId(null); }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-[var(--surface-0)] border border-brand-500/40 rounded px-2 py-0.5 text-xs outline-none min-w-0"
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleRenameConfirm(); }} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setRenamingId(null); }} className="text-red-400 hover:text-red-300"><X size={12} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-medium">{conv.title}</div>
                      <div className="text-[10px] opacity-50">{formatRelativeTime(conv.updatedAt)}</div>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      {/* Export dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowExport(showExport === conv.id ? null : conv.id); }}
                          className="p-1 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          title="Export"
                        >
                          <Download size={11} />
                        </button>
                        <AnimatePresence>
                          {showExport === conv.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-6 z-50 bg-[var(--surface-0)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden w-28"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button onClick={() => handleExport(conv.id, 'txt')} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[var(--surface-2)] transition-colors">
                                <FileText size={11} /> Export TXT
                              </button>
                              <button onClick={() => handleExport(conv.id, 'pdf')} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[var(--surface-2)] transition-colors">
                                <FileText size={11} /> Export PDF
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRenameStart(conv.id, conv.title); }}
                        className="p-1 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Rename"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-1">
        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] text-xs transition-colors"
        >
          <Settings size={13} /> Settings
        </button>

        <AnimatePresence>
          {showSettings && <SettingsPanel />}
        </AnimatePresence>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] text-xs transition-colors"
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Badge */}
        <div className="flex items-center justify-center gap-1 pt-1">
          <Sparkles size={10} className="text-brand-400" />
          <span className="text-[10px] text-[var(--text-muted)]">Powered by Free AI APIs</span>
        </div>
      </div>
    </motion.aside>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel() {
  const { memory, updateMemory } = useChatStore();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-2 py-2 bg-[var(--surface-2)] rounded-xl space-y-2 overflow-hidden"
    >
      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">AI Memory</p>
      <input
        placeholder="Your name (optional)"
        value={memory.name || ''}
        onChange={(e) => updateMemory({ name: e.target.value })}
        className="w-full bg-[var(--surface-0)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand-500 transition-colors"
      />
      <select
        value={memory.preferredStyle || 'casual'}
        onChange={(e) => updateMemory({ preferredStyle: e.target.value as 'casual' | 'professional' | 'concise' })}
        className="w-full bg-[var(--surface-0)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand-500 transition-colors cursor-pointer"
      >
        <option value="casual">Casual style</option>
        <option value="professional">Professional</option>
        <option value="concise">Concise</option>
      </select>
      <textarea
        placeholder="Custom system prompt (optional)"
        value={memory.systemPrompt || ''}
        onChange={(e) => updateMemory({ systemPrompt: e.target.value })}
        rows={2}
        className="w-full bg-[var(--surface-0)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand-500 transition-colors resize-none"
      />
    </motion.div>
  );
}
