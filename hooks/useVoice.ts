'use client';
/**
 * hooks/useVoice.ts
 * Web Speech API: Speech-to-Text (input) and Text-to-Speech (output).
 * Works in modern browsers — Chrome, Edge, Safari.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVoice() {
  const [isListening, setIsListening]     = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [transcript, setTranscript]       = useState('');
  const [isSupported, setIsSupported]     = useState(false);
  const [ttsSupported, setTtsSupported]   = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef       = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    // Check TTS support
    setTtsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    synthRef.current = window.speechSynthesis;
  }, []);

  /** Start listening for voice input */
  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    const recognition = new (SpeechRecognition as new () => SpeechRecognitionInstance)();
    recognition.continuous    = false;
    recognition.interimResults = true;
    recognition.lang          = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final   = '';
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          final += r[0].transcript;
        } else {
          interim += r[0].transcript;
        }
      }
      setTranscript(final || interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, [isSupported]);

  /** Stop listening */
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  /** Clear transcript */
  const clearTranscript = useCallback(() => setTranscript(''), []);

  /** Speak text aloud */
  const speak = useCallback(
    (text: string) => {
      if (!ttsSupported || !synthRef.current) return;

      // Cancel any ongoing speech
      synthRef.current.cancel();

      // Strip markdown for cleaner reading
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'code block')
        .replace(/`[^`]+`/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .slice(0, 1000); // Limit length

      const utterance   = new SpeechSynthesisUtterance(cleanText);
      utterance.rate    = 1.0;
      utterance.pitch   = 1.0;
      utterance.volume  = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend   = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [ttsSupported]
  );

  /** Stop speaking */
  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    isSupported,
    ttsSupported,
    startListening,
    stopListening,
    clearTranscript,
    speak,
    stopSpeaking,
  };
}
