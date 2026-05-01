'use client';
/**
 * hooks/useChat.ts
 * Custom hook that handles sending messages and streaming AI responses.
 */
import { useCallback, useRef } from 'react';
import { useChatStore, AVAILABLE_MODELS } from '@/store/chatStore';

export function useChat() {
  const {
    activeConversationId,
    selectedModelId,
    conversations,
    memory,
    createConversation,
    addMessage,
    updateMessage,
    setStreaming,
    isStreaming,
  } = useChatStore();

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, imageBase64?: string) => {
      if (isStreaming || !content.trim()) return;

      // Ensure we have an active conversation
      let convId = activeConversationId;
      if (!convId) {
        convId = createConversation();
      }

      // Add user message
      addMessage(convId, {
        role: 'user',
        content,
        model: selectedModelId,
        ...(imageBase64 ? { imageUrl: imageBase64 } : {}),
      });

      // Add placeholder assistant message
      const assistantMsg = addMessage(convId, {
        role: 'assistant',
        content: '',
        model: selectedModelId,
      });

      setStreaming(true, assistantMsg.id);

      // Build system prompt from memory
      const systemPrompt = buildSystemPrompt(memory);

      // Get conversation history (last 20 messages for context)
      const conv = useChatStore.getState().conversations.find((c) => c.id === convId);
      const historyMessages = (conv?.messages ?? [])
        .slice(-20)
        .filter((m) => m.role !== 'assistant' || m.content) // Skip empty assistant messages
        .filter((m) => m.id !== assistantMsg.id) // Exclude the placeholder
        .map((m) => ({ role: m.role, content: m.content }));

      abortRef.current = new AbortController();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            messages: historyMessages,
            modelId: selectedModelId,
            systemPrompt,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error('Stream response failed');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              // Handle error from server
              if (parsed.error) {
                accumulated = parsed.error;
                updateMessage(convId!, assistantMsg.id, accumulated);
                break;
              }
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                accumulated += token;
                updateMessage(convId!, assistantMsg.id, accumulated);
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }

        // Final update in case anything was missed
        if (accumulated) {
          updateMessage(convId!, assistantMsg.id, accumulated);
        } else {
          updateMessage(convId!, assistantMsg.id, '_(No response received. Try a different model.)_');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled — keep partial response
        } else {
          updateMessage(
            convId!,
            assistantMsg.id,
            '⚠️ Error connecting to AI. Please check your API keys in `.env.local` and try again.'
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [activeConversationId, selectedModelId, isStreaming, memory, createConversation, addMessage, updateMessage, setStreaming]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  return { sendMessage, stopStreaming, isStreaming };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildSystemPrompt(memory: { name?: string; preferredStyle?: string; systemPrompt?: string }): string {
  if (memory.systemPrompt) return memory.systemPrompt;

  const parts = [
    'You are Mano AI, a helpful, accurate, and friendly AI assistant.',
    'Format responses clearly using markdown when appropriate.',
    'Use code blocks for code snippets.',
  ];

  if (memory.name) parts.push(`The user's name is ${memory.name}.`);

  if (memory.preferredStyle === 'concise') {
    parts.push('Be concise and to the point. Avoid unnecessary verbosity.');
  } else if (memory.preferredStyle === 'professional') {
    parts.push('Maintain a professional, formal tone.');
  } else {
    parts.push('Be conversational and approachable.');
  }

  return parts.join(' ');
}

export function getModelById(id: string) {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}
