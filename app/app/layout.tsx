import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mano AI — Chat & Image Studio',
  description: 'Your AI assistant for chat, image generation, voice input, and more.',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
