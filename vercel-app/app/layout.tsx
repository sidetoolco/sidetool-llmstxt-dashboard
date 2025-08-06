import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/Auth/AuthProvider'
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
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}