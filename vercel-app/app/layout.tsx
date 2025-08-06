import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { ToastProvider } from '@/components/ui/Toast/ToastProvider'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LLMs.txt Generator - Create AI-Ready Content from Any Website',
  description: 'Generate standardized llms.txt and llms-full.txt files from any website for LLM inference and training. Powered by Firecrawl and OpenAI.',
  keywords: 'LLMs.txt, AI content, web scraping, Firecrawl, OpenAI, GPT-4, content indexing',
  authors: [{ name: 'LLMs.txt Generator Team' }],
  openGraph: {
    title: 'LLMs.txt Generator',
    description: 'Transform any website into AI-ready content files',
    type: 'website',
    url: 'https://llmstxt-generator.vercel.app',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              {/* Skip to main content link for accessibility */}
              <a href="#main" className="skip-to-content">
                Skip to main content
              </a>
              <main id="main">
                {children}
              </main>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}