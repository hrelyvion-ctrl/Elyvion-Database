import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Elyvion — Resume Database',
  description: 'Professional resume management system with smart parsing, full-text search, and analytics.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-grid">
        {/* Ambient glow blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600 opacity-10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-80 h-80 bg-purple-600 opacity-8 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-cyan-600 opacity-6 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen w-full">
          <Sidebar />
          <main className="flex-1 ml-72 min-h-screen border-l border-white/5">
            <div className="p-8 w-full animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
