'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { RayLogo, RayLogoMark } from '@/components/Brand/RayLogo'

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-ray-black">
      {/* Navigation */}
      <nav className="bg-ray-gray-950 border-b border-ray-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <RayLogo size="sm" />
            
            <div className="flex items-center gap-3">
              <a href="/auth" className="text-ray-gray-400 hover:text-ray-gray-100 text-sm transition-colors">
                Sign In
              </a>
              <a 
                href="/auth" 
                className="btn-ray text-sm"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <RayLogoMark size={64} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Transform Websites into
            <span className="block text-ray-red">
              AI-Ready Content
            </span>
          </h1>
          <p className="text-lg text-ray-gray-400 mb-8 max-w-2xl mx-auto">
            Generate standardized llms.txt files from any website. 
            Perfect for LLM training and making content discoverable by AI.
          </p>
          <div className="flex gap-3 justify-center">
            <a 
              href="/auth"
              className="btn-ray"
            >
              Start Generating
            </a>
            <a 
              href="#how-it-works"
              className="btn-ray-secondary"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center text-white mb-12">
          Powered by Industry-Leading Technology
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="ray-card p-6">
            <div className="w-10 h-10 bg-ray-orange/20 rounded flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-ray-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Firecrawl Integration</h3>
            <p className="text-sm text-ray-gray-400">
              Advanced web crawling and content extraction with clean, structured output.
            </p>
          </div>

          <div className="ray-card p-6">
            <div className="w-10 h-10 bg-ray-green/20 rounded flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-ray-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">GPT-4 Summaries</h3>
            <p className="text-sm text-ray-gray-400">
              AI-powered content summarization for optimal LLM understanding.
            </p>
          </div>

          <div className="ray-card p-6">
            <div className="w-10 h-10 bg-ray-blue/20 rounded flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-ray-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Batch Processing</h3>
            <p className="text-sm text-ray-gray-400">
              Parallel processing for fast generation of hundreds of pages.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-ray-gray-950 border-y border-ray-gray-800 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-white mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-ray-gray-900 border border-ray-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-ray-red">1</span>
              </div>
              <h3 className="font-semibold text-white mb-1 text-sm">Enter Domain</h3>
              <p className="text-xs text-ray-gray-500">
                Input the website domain
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-ray-gray-900 border border-ray-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-ray-red">2</span>
              </div>
              <h3 className="font-semibold text-white mb-1 text-sm">Map & Crawl</h3>
              <p className="text-xs text-ray-gray-500">
                Extract content from pages
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-ray-gray-900 border border-ray-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-ray-red">3</span>
              </div>
              <h3 className="font-semibold text-white mb-1 text-sm">AI Processing</h3>
              <p className="text-xs text-ray-gray-500">
                Generate summaries with GPT-4
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-ray-gray-900 border border-ray-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-ray-red">4</span>
              </div>
              <h3 className="font-semibold text-white mb-1 text-sm">Download</h3>
              <p className="text-xs text-ray-gray-500">
                Get your llms.txt files
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center text-white mb-12">
          Perfect For
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="ray-card p-6">
            <h3 className="text-lg font-semibold text-white mb-3">AI Training & Fine-tuning</h3>
            <p className="text-sm text-ray-gray-400 mb-4">
              Create high-quality datasets from any website for training language models.
            </p>
            <ul className="space-y-2 text-xs text-ray-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-ray-green mt-0.5">✓</span>
                <span>Clean, structured markdown content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ray-green mt-0.5">✓</span>
                <span>Consistent formatting across pages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ray-green mt-0.5">✓</span>
                <span>AI-generated summaries for context</span>
              </li>
            </ul>
          </div>

          <div className="ray-card p-6">
            <h3 className="text-lg font-semibold text-white mb-3">AI Discovery & SEO</h3>
            <p className="text-sm text-ray-gray-400 mb-4">
              Make your content discoverable by ChatGPT, Claude, and other AI systems.
            </p>
            <ul className="space-y-2 text-xs text-ray-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-ray-green mt-0.5">✓</span>
                <span>Standard llms.txt format</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ray-green mt-0.5">✓</span>
                <span>Optimized for AI crawlers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ray-green mt-0.5">✓</span>
                <span>Ready to deploy at /llms.txt</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-ray-gray-950 border-t border-ray-gray-800 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to Make Your Content AI-Ready?
          </h2>
          <p className="text-base text-ray-gray-400 mb-6">
            Start generating LLMs.txt files in minutes. No credit card required.
          </p>
          <a 
            href="/auth"
            className="btn-ray"
          >
            Get Started Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ray-black border-t border-ray-gray-800 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <RayLogo size="sm" />
            <p className="text-xs text-ray-gray-600">
              © 2024 SideGSO. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}