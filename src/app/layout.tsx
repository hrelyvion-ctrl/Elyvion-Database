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

        <div className="relative z-10 flex min-h-screen">
          {/* Fixed Sidebar Container */}
          <div className="w-72 shrink-0 border-r border-white/5">
             <Sidebar />
          </div>
          
          {/* Expanded Page Content */}
          <main className="flex-1 min-h-screen bg-slate-950/20 backdrop-blur-[2px]">
             <div className="py-12 container-full animate-fade-in h-screen overflow-y-auto custom-scrollbar">
                {children}
             </div>
          </main>
        </div>
      </body>
    </html>
  )
}
