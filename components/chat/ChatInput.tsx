'use client';
/**
 * components/chat/ChatInput.tsx
 * The main message input with voice, file upload, and send functionality.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, MicOff, StopCircle, Paperclip, X,
  Loader2, Smile,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useVoice } from '@/hooks/useVoice';

interface Props {
  onSend: (message: string, imageBase64?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_FILE_SIZE_MB = 5;

export default function ChatInput({ onSend, onStop, isStreaming, disabled, placeholder }: Props) {
  const [input, setInput]             = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string; type: string } | null>(null);
  const [isDragging, setIsDragging]   = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported, transcript, startListening, stopListening, clearTranscript } = useVoice();

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [input]);

  // Fill input from voice transcript
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const handleSend = useCallback(() => {
    if (isStreaming) { onStop(); return; }
    const text = input.trim();
    if (!text && !uploadedFile) return;

    onSend(text || '(Analyze this file)', uploadedFile?.base64);
    setInput('');
    setUploadedFile(null);
    clearTranscript();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, uploadedFile, isStreaming, onSend, onStop, clearTranscript]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleFileChange = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedFile({ name: file.name, base64, type: file.type });
      // Auto-fill input with analysis prompt for non-images
      if (!file.type.startsWith('image/')) {
        setInput(`Please analyze and summarize this file: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const canSend = (input.trim().length > 0 || !!uploadedFile) && !disabled;

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Drop zone hint */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-brand-500/10 border-2 border-dashed border-brand-500 rounded-2xl"
          >
            <p className="text-brand-400 font-semibold text-sm">Drop file here</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded file chip */}
      <AnimatePresence>
        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex items-center gap-2 mb-2 px-1"
          >
            <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-xl px-3 py-1.5">
              {uploadedFile.type.startsWith('image/') ? (
                <img src={uploadedFile.base64} alt="" className="w-6 h-6 rounded object-cover" />
              ) : (
                <Paperclip size={13} className="text-brand-400" />
              )}
              <span className="text-xs text-brand-300 font-medium max-w-[200px] truncate">{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} className="text-[var(--text-muted)] hover:text-red-400">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice listening indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 mb-2 px-1 text-xs text-red-400"
          >
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Listening... speak now
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input area */}
      <div
        className={cn(
          'flex items-end gap-2 bg-[var(--surface-1)] border rounded-2xl px-3 py-3 transition-all',
          isDragging ? 'border-brand-500 shadow-lg' : 'border-[var(--border-default)] focus-within:border-brand-500/60 focus-within:shadow-md',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors shrink-0"
          title="Attach file or image"
        >
          <Paperclip size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt,.md,.csv"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); e.target.value = ''; }}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (isListening ? 'Listening...' : 'Message Mano AI...')}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm resize-none outline-none leading-relaxed max-h-48 overflow-y-auto',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        {/* Voice input button */}
        {isSupported && (
          <button
            onClick={handleVoiceToggle}
            disabled={disabled}
            className={cn(
              'p-1.5 rounded-lg transition-colors shrink-0',
              isListening
                ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
            )}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        {/* Send / Stop button */}
        <button
          onClick={handleSend}
          disabled={!isStreaming && !canSend}
          className={cn(
            'p-2 rounded-xl transition-all shrink-0 font-medium',
            isStreaming
              ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
              : canSend
              ? 'brand-bg-gradient text-white hover:opacity-90 shadow-sm'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed'
          )}
          title={isStreaming ? 'Stop generation' : 'Send'}
        >
          {isStreaming ? (
            <StopCircle size={16} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>

      <p className="text-center text-[10px] text-[var(--text-muted)] mt-2">
        Mano AI can make mistakes. Press <kbd className="px-1 py-0.5 rounded bg-[var(--surface-2)] font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-[var(--surface-2)] font-mono">Shift+Enter</kbd> for newline
      </p>
    </div>
  );
}
