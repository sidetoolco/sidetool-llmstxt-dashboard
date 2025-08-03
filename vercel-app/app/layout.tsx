import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sidetool LLMs.txt Generator - AI Content Discovery',
  description: 'Automated daily generation of LLMs.txt files for sidetool.co, optimized for ChatGPT and Perplexity discovery',
  keywords: 'LLMs.txt, AI discovery, ChatGPT, Perplexity, Sidetool, content indexing',
  authors: [{ name: 'Sidetool Team' }],
  openGraph: {
    title: 'Sidetool LLMs.txt Generator',
    description: 'Making sidetool.co content discoverable by AI systems',
    type: 'website',
    url: 'https://sidetool-llmstxt-dashboard.vercel.app',
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}