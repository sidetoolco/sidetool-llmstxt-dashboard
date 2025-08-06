'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp, signInWithGoogle, signInWithGitHub, resetPassword } = useAuth()
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    // Email validation
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    // Password validation
    if (mode !== 'reset') {
      if (!password) {
        newErrors.password = 'Password is required'
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      } else if (mode === 'signup') {
        // Additional password strength checks for signup
        if (!/(?=.*[a-z])/.test(password)) {
          newErrors.password = 'Password must contain a lowercase letter'
        } else if (!/(?=.*[A-Z])/.test(password)) {
          newErrors.password = 'Password must contain an uppercase letter'
        } else if (!/(?=.*\d)/.test(password)) {
          newErrors.password = 'Password must contain a number'
        }
      }
    }
    
    // Name validation for signup
    if (mode === 'signup' && !name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Clear errors when switching modes
  useEffect(() => {
    setErrors({})
  }, [mode])
  
  // Auto-focus first input
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstInput = document.querySelector<HTMLInputElement>('input:not([type="hidden"])')
      firstInput?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0]
      document.getElementById(firstErrorField)?.focus()
      return
    }
    
    setLoading(true)

    measurePerformance('auth-submit', async () => {
      try {
        if (mode === 'reset') {
          const { error } = await resetPassword(email)
          if (error) throw error
          
          addToast({
            type: 'success',
            title: 'Check your email',
            description: 'We sent you a password reset link',
            duration: 5000
          })
          
          setMode('signin')
          return
        }

        const { error } = mode === 'signin' 
          ? await signIn(email, password)
          : await signUp(email, password, name)

        if (error) throw error
        
        addToast({
          type: 'success',
          title: mode === 'signin' ? 'Welcome back!' : 'Account created!',
          description: 'Redirecting to dashboard...',
          duration: 2000
        })
        
        router.push('/dashboard')
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Authentication failed',
          description: err.message || 'Please try again',
          duration: 5000
        })
      } finally {
        setLoading(false)
      }
    })
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true)

    try {
      const { error } = provider === 'google' 
        ? await signInWithGoogle()
        : await signInWithGitHub()

      if (error) throw error
      
      addToast({
        type: 'info',
        title: 'Redirecting...',
        description: `Signing in with ${provider}`,
        duration: 2000
      })
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'OAuth failed',
        description: err.message || 'Please try again',
        duration: 5000
      })
      setLoading(false)
    }
  }

  const inputClasses = (fieldName: string) => `
    w-full px-4 py-3 border rounded-lg
    transition-all duration-150
    ${errors[fieldName] 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }
    focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-50 disabled:text-gray-500
  `

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
      {/* Skip to content for accessibility */}
      <a href="#auth-form" className="skip-to-content">
        Skip to authentication form
      </a>
      
      <motion.div 
        className="max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo and heading */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold text-2xl">S</span>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900">SideGSO</h1>
          </div>
          <p className="text-gray-600">
            {mode === 'signin' ? 'Welcome back! Sign in to continue' : 
             mode === 'signup' ? 'Create your account to get started' : 
             'Reset your password'}
          </p>
        </motion.div>

        {/* Auth Form */}
        <motion.div 
          id="auth-form"
          className="bg-white rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* OAuth Buttons */}
          <AnimatePresence mode="wait">
            {mode !== 'reset' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-3 mb-6">
                  <Button
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={loading}
                    variant="secondary"
                    fullWidth
                    icon={
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    }
                    aria-label="Sign in with Google"
                  >
                    Continue with Google
                  </Button>
                  
                  <Button
                    onClick={() => handleOAuthSignIn('github')}
                    disabled={loading}
                    variant="secondary"
                    fullWidth
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                    }
                    aria-label="Sign in with GitHub"
                  >
                    Continue with GitHub
                  </Button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) setErrors({ ...errors, name: '' })
                    }}
                    className={inputClasses('name')}
                    placeholder="John Doe"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.name}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: '' })
                }}
                required
                className={inputClasses('email')}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <AnimatePresence mode="wait">
              {mode !== 'reset' && (
                <motion.div
                  key="password-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors({ ...errors, password: '' })
                      }}
                      required
                      className={`${inputClasses('password')} pr-10`}
                      placeholder="••••••••"
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.password}
                    </p>
                  )}
                  {mode === 'signup' && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Password strength:</div>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded ${
                              password.length >= level * 2
                                ? level <= 2 ? 'bg-yellow-400' : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="mt-6"
            >
              {mode === 'signin' ? 'Sign In' : 
               mode === 'signup' ? 'Create Account' : 
               'Send Reset Email'}
            </Button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 text-center text-sm">
            {mode === 'signin' ? (
              <>
                <button
                  onClick={() => setMode('reset')}
                  className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  Forgot password?
                </button>
                <span className="text-gray-500 mx-2">•</span>
                <span className="text-gray-500">Don't have an account? </span>
                <button
                  onClick={() => setMode('signup')}
                  className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  Sign up
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                <span className="text-gray-500">Already have an account? </span>
                <button
                  onClick={() => setMode('signin')}
                  className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('signin')}
                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Back to sign in
              </button>
            )}
          </div>
        </motion.div>

        {/* Security note */}
        <motion.p 
          className="mt-8 text-center text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Your data is encrypted and secure. We never share your information.
        </motion.p>
      </motion.div>
    </div>
  )
}