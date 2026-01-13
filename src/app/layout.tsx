import type { Metadata } from 'next'
import './globals.css'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar, DashboardHeader } from '@/components/dashboard'
import { Toaster } from '@/components/ui/sonner'
import { MobileNav } from '@/components/ui/mobile-nav'

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
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <DashboardHeader />
            <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <MobileNav />
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}
