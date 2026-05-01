/**
 * store/chatStore.ts
 * Global state management using Zustand.
 * Handles: conversations, active session, model selection, memory, theme.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';


// ─── Types ────────────────────────────────────────────────────────────────────
export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  model?: string;
  imageUrl?: string;   // for image messages
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

export interface UserMemory {
  name?: string;
  preferredStyle?: 'casual' | 'professional' | 'concise';
  language?: string;
  systemPrompt?: string;
}

export interface ChatModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'groq';
  description: string;
  free: boolean;
}

// ─── Available Models ─────────────────────────────────────────────────────────
export const AVAILABLE_MODELS: ChatModel[] = [
  {
    id: 'openrouter/auto',
    name: 'Auto (Recommended)',
    provider: 'openrouter',
    description: 'Automatically selects fastest available model',
    free: true,
  },
  {
    id: 'meta-llama/llama-3-8b-instruct:free',
    name: 'LLaMA 3 8B',
    provider: 'openrouter',
    description: "Meta's latest open model",
    free: true,
  },
  {
    id: 'meta-llama/llama-2-7b-chat:free',
    name: 'LLaMA 2 7B',
    provider: 'openrouter',
    description: 'Meta open model',
    free: true,
  },
  {
    id: 'google/gemma-2-9b-it:free',
    name: 'Gemma 2 9B',
    provider: 'openrouter',
    description: "Google's efficient model",
    free: true,
  },
  {
    id: 'llama3-8b-8192',
    name: 'LLaMA 3 (Groq)',
    provider: 'groq',
    description: 'Lightning-fast via Groq',
    free: true,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (Groq)',
    provider: 'groq',
    description: 'Powerful MoE model via Groq',
    free: true,
  },
];

// ─── Store Interface ──────────────────────────────────────────────────────────
interface ChatStore {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // Model
  selectedModelId: string;

  // Memory
  memory: UserMemory;

  // Theme
  theme: 'light' | 'dark';

  // Sidebar
  sidebarOpen: boolean;

  // Streaming
  isStreaming: boolean;
  streamingMessageId: string | null;

  // Actions
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Message;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
  clearConversation: (conversationId: string) => void;
  setSelectedModel: (modelId: string) => void;
  updateMemory: (memory: Partial<UserMemory>) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarOpen: (open: boolean) => void;
  setStreaming: (isStreaming: boolean, messageId?: string) => void;
  getActiveConversation: () => Conversation | null;
  renameConversation: (id: string, title: string) => void;
}

// ─── Store Implementation ─────────────────────────────────────────────────────
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      selectedModelId: AVAILABLE_MODELS[0].id,
      memory: {},
      theme: 'dark',
      sidebarOpen: true,
      isStreaming: false,
      streamingMessageId: null,

      createConversation: () => {
        const id = crypto.randomUUID();
        const newConversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: get().selectedModelId,
        };
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          const newActiveId =
            state.activeConversationId === id
              ? filtered[0]?.id ?? null
              : state.activeConversationId;
          return { conversations: filtered, activeConversationId: newActiveId };
        });
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      addMessage: (conversationId, message) => {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          ...message,
        };
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const updated = { ...c, messages: [...c.messages, newMessage], updatedAt: Date.now() };
            // Auto-title from first user message
            if (c.title === 'New Chat' && message.role === 'user') {
              updated.title = message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '');
            }
            return updated;
          }),
        }));
        return newMessage;
      },

      updateMessage: (conversationId, messageId, content) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id !== conversationId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, content } : m
                  ),
                  updatedAt: Date.now(),
                }
          ),
        }));
      },

      clearConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, messages: [], updatedAt: Date.now() } : c
          ),
        }));
      },

      setSelectedModel: (modelId) => {
        set({ selectedModelId: modelId });
      },

      updateMemory: (memory) => {
        set((state) => ({ memory: { ...state.memory, ...memory } }));
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(next);
        localStorage.setItem('mano-theme', next);
        set({ theme: next });
      },

      setTheme: (theme) => {
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
        localStorage.setItem('mano-theme', theme);
        set({ theme });
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setStreaming: (isStreaming, messageId) => {
        set({ isStreaming, streamingMessageId: messageId ?? null });
      },

      getActiveConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.activeConversationId) ?? null;
      },

      renameConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        }));
      },
    }),
    {
      name: 'mano-chat-storage',
      // Only persist these keys — don't persist streaming state
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        selectedModelId: state.selectedModelId,
        memory: state.memory,
        theme: state.theme,
      }),
    }
  )
);
