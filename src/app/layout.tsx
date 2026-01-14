import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Blackmine - Project Management',
  description: 'A modern project management and issue tracking system',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent flash - runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = null;
                try {
                  stored = localStorage.getItem('theme');
                } catch (e) {}

                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = stored === 'dark' || stored === 'light'
                  ? stored
                  : (prefersDark ? 'dark' : 'light');

                try {
                  if (stored !== theme) {
                    localStorage.setItem('theme', theme);
                  }
                } catch (e) {}

                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}
