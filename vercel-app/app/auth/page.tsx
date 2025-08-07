'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { RayLogo, RayLogoMark } from '@/components/Brand/RayLogo'

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
    <div className="min-h-screen bg-ray-black flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <RayLogoMark size={48} />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">SideGSO</h1>
          <p className="text-ray-gray-400 text-sm">
            {mode === 'signin' ? 'Sign in to your account' : 
             mode === 'signup' ? 'Create a new account' : 
             'Reset your password'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="ray-card p-6">
          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-ray-gray-400 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-ray"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-ray-gray-400 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-ray"
                placeholder="you@example.com"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-ray-gray-400 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-ray"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="toast-ray border-ray-red text-ray-red text-xs">
                {error}
              </div>
            )}

            {success && (
              <div className="toast-ray border-ray-green text-ray-green text-xs">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-ray disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="ray-loading" />
                  Processing...
                </>
              ) : (
               mode === 'signin' ? 'Sign In' : 
               mode === 'signup' ? 'Create Account' : 
               'Send Reset Email'
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 text-center text-xs">
            {mode === 'signin' ? (
              <>
                <button
                  onClick={() => setMode('reset')}
                  className="text-ray-gray-400 hover:text-ray-gray-100 transition-colors"
                >
                  Forgot password?
                </button>
                <span className="text-ray-gray-600 mx-2">•</span>
                <span className="text-ray-gray-500">Don't have an account? </span>
                <button
                  onClick={() => setMode('signup')}
                  className="text-ray-red hover:text-ray-red/80 transition-colors font-medium"
                >
                  Sign up
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                <span className="text-ray-gray-500">Already have an account? </span>
                <button
                  onClick={() => setMode('signin')}
                  className="text-ray-red hover:text-ray-red/80 transition-colors font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('signin')}
                className="text-ray-red hover:text-ray-red/80 transition-colors font-medium"
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