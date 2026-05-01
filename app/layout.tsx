import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'Mano AI — Your Intelligent Assistant',
  description:
    'Mano AI is a free, production-ready AI web app with chatbot, image generation, voice input, and more. Powered by free AI APIs.',
  keywords: ['AI', 'chatbot', 'image generation', 'free AI', 'Mano AI'],
  openGraph: {
    title: 'Mano AI — Your Intelligent Assistant',
    description: 'Chat, create images, and more — all powered by free AI APIs.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline theme script to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('mano-theme') || 'dark';
                  document.documentElement.classList.add(theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans bg-[var(--surface-0)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
