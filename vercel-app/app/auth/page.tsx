'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { Logo, BrandPattern } from '@/components/Brand/Logo'

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp, resetPassword } = useAuth()
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'reset') {
        const { error } = await resetPassword(email)
        if (error) throw error
        setSuccess('Password reset email sent! Check your inbox.')
        return
      }

      const { error } = mode === 'signin' 
        ? await signIn(email, password)
        : await signUp(email, password, name)

      if (error) throw error
      
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen mesh-gradient relative overflow-hidden flex items-center justify-center px-4">
      <BrandPattern className="opacity-5" />
      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo variant="gradient" size="xl" showText={true} className="animate-fade-in" />
          </div>
          <p className="text-gray-700 text-lg">
            {mode === 'signin' ? 'Welcome back! Sign in to continue' : 
             mode === 'signup' ? 'Start generating AI-ready content' : 
             'Reset your password'}
          </p>
        </div>

        {/* Auth Form with glass effect */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 glass-card rounded-lg text-gray-900 placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    transition-all duration-200 gradient-border"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 glass-card rounded-lg text-gray-900 placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200 gradient-border"
                placeholder="you@example.com"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 glass-card rounded-lg text-gray-900 placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    transition-all duration-200 gradient-border"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50/80 backdrop-blur border border-red-200 rounded-lg text-red-700 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50/80 backdrop-blur border border-green-200 rounded-lg text-green-700 text-sm animate-fade-in">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brand py-3 disabled:opacity-50 shimmer"
            >
              {loading ? 'Processing...' : 
               mode === 'signin' ? 'Sign In' : 
               mode === 'signup' ? 'Create Account' : 
               'Send Reset Email'}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 text-center text-sm">
            {mode === 'signin' ? (
              <>
                <button
                  onClick={() => setMode('reset')}
                  className="gradient-text hover:opacity-80 transition-opacity"
                >
                  Forgot password?
                </button>
                <span className="text-gray-500 mx-2">•</span>
                <span className="text-gray-600">Don't have an account? </span>
                <button
                  onClick={() => setMode('signup')}
                  className="gradient-text hover:opacity-80 transition-opacity font-medium"
                >
                  Sign up
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                <span className="text-gray-600">Already have an account? </span>
                <button
                  onClick={() => setMode('signin')}
                  className="gradient-text hover:opacity-80 transition-opacity font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('signin')}
                className="gradient-text hover:opacity-80 transition-opacity font-medium"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}