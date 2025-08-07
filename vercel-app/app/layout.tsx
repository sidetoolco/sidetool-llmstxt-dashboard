import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://gso.sidetool.co'),
  title: 'SideGSO - Create AI-Ready Content from Any Website',
  description: 'Generate standardized llms.txt and llms-full.txt files from any website for LLM inference and training. Powered by Firecrawl and OpenAI.',
  keywords: 'SideGSO, LLMs.txt, AI content, web scraping, Firecrawl, OpenAI, GPT-4, content indexing',
  authors: [{ name: 'SideGSO Team' }],
  openGraph: {
    title: 'SideGSO',
    description: 'Transform any website into AI-ready content files',
    type: 'website',
    url: 'https://gso.sidetool.co',
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
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}