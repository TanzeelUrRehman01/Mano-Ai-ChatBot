'use client';
/**
 * app/app/page.tsx
 * The main application page with sidebar + content area.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Sidebar    from '@/components/layout/Sidebar';
import ChatPanel  from '@/components/chat/ChatPanel';
import ImagePanel from '@/components/image/ImagePanel';
import { useChatStore } from '@/store/chatStore';

export default function AppPage() {
  const [activeTab, setActiveTab]   = useState<'chat' | 'image'>('chat');
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const { theme, sidebarOpen }            = useChatStore();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--surface-0)]">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — Desktop: inline. Mobile: overlay drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72
          md:relative md:z-auto md:w-auto
          transition-transform duration-300
          ${mobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${sidebarOpen ? 'md:w-72' : 'md:w-14'}
        `}
      >
        <Sidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setMobileSidebar(false); }} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)] md:hidden bg-[var(--surface-1)]">
          <button
            onClick={() => setMobileSidebar(true)}
            className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
          >
            <Menu size={18} />
          </button>
          <span className="font-bold text-sm brand-gradient">Mano AI</span>
        </div>

        {/* Panel */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ChatPanel />
              </motion.div>
            ) : (
              <motion.div
                key="image"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ImagePanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
