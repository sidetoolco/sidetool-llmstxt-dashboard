'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { LoadingDotsAnimation } from '@/components/ui/LottieAnimations'

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SideGSO</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <a 
                href="/auth" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </a>
              <button 
                onClick={handleGetStarted}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Get Started'
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Animated Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-sm font-medium text-orange-700">AI-Ready in Minutes</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Websites into
              <span className="block bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                AI-Ready Content
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Generate standardized llms.txt files from any website with one click. 
              Make your content discoverable by ChatGPT, Claude, and other AI systems.
            </p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button 
                onClick={handleGetStarted}
                className="btn-primary btn-lg group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingDotsAnimation size={60} />
                ) : (
                  <>
                    Start Generating
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
              <a 
                href="#how-it-works"
                className="btn-secondary btn-lg"
              >
                See How It Works
              </a>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Process 100+ pages</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>GPT-4 powered</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -z-10 transform translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full opacity-50 blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 -z-10 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50 blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <FeatureSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Use Cases */}
      <UseCasesSection />

      {/* CTA Section */}
      <CTASection onGetStarted={handleGetStarted} isLoading={isLoading} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">SideGSO</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 SideGSO. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Feature Section Component
function FeatureSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      title: 'Firecrawl Integration',
      description: 'Advanced web crawling with clean, structured content extraction',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'GPT-4 Powered',
      description: 'Intelligent content summarization for optimal AI understanding',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Lightning Fast',
      description: 'Parallel processing handles hundreds of pages in minutes',
      color: 'from-blue-500 to-purple-500'
    }
  ]

  return (
    <section ref={ref} className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Enterprise-Grade Technology
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built with the most advanced tools to ensure accuracy and speed
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorksSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  
  const steps = [
    { number: '1', title: 'Enter Domain', description: 'Paste any website URL' },
    { number: '2', title: 'AI Crawls', description: 'Smart content extraction' },
    { number: '3', title: 'Process', description: 'GPT-4 generates summaries' },
    { number: '4', title: 'Download', description: 'Get your llms.txt files' }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Four Simple Steps
          </h2>
          <p className="text-lg text-gray-600">
            From any website to AI-ready content in minutes
          </p>
        </motion.div>
        
        <div ref={ref} className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200" />
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center relative"
              >
                <div className="bg-white relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white font-bold text-xl">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Use Cases Section
function UseCasesSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  
  return (
    <section ref={ref} className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Your Needs
          </h2>
          <p className="text-lg text-gray-600">
            Whether you're training AI or improving discoverability
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">AI Training & Fine-tuning</h3>
            <p className="text-gray-600 mb-6">
              Create high-quality datasets from any website for training language models.
            </p>
            <ul className="space-y-3">
              {[
                'Clean, structured markdown content',
                'Consistent formatting across pages',
                'AI-generated summaries for context'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">AI Discovery & SEO</h3>
            <p className="text-gray-600 mb-6">
              Make your content discoverable by ChatGPT, Claude, and other AI systems.
            </p>
            <ul className="space-y-3">
              {[
                'Standard llms.txt format',
                'Optimized for AI crawlers',
                'Ready to deploy at /llms.txt'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection({ onGetStarted, isLoading }: { onGetStarted: (e: React.MouseEvent) => void, isLoading: boolean }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  
  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-orange-500 to-orange-600">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Make Your Content AI-Ready?
        </h2>
        <p className="text-xl text-orange-100 mb-8">
          Join thousands of websites already discoverable by AI
        </p>
        <button 
          onClick={onGetStarted}
          className="btn-secondary btn-lg shadow-xl hover:shadow-2xl"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingDotsAnimation size={60} />
          ) : (
            <>
              Start Free Trial
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
        <p className="mt-4 text-sm text-orange-100">
          No credit card required • Process up to 100 pages free
        </p>
      </motion.div>
    </section>
  )
}