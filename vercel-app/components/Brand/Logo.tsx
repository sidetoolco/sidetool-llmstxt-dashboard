import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'white' | 'gradient'
  showText?: boolean
  className?: string
}

export function Logo({ 
  size = 'md', 
  variant = 'default', 
  showText = true,
  className = '' 
}: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-2xl' },
    lg: { icon: 40, text: 'text-3xl' },
    xl: { icon: 48, text: 'text-4xl' }
  }
  
  const colors = {
    default: '#6366f1',
    white: '#ffffff',
    gradient: 'url(#logo-gradient)'
  }
  
  const { icon, text } = sizes[size]
  const color = colors[variant]
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Animated Logo Icon */}
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-float"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          
          {/* Outer Ring */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke={variant === 'gradient' ? 'url(#logo-gradient)' : color}
            strokeWidth="2"
            fill="none"
            strokeDasharray="4 2"
            className="animate-spin-slow"
            style={{ animationDuration: '20s' }}
          />
          
          {/* Inner Hexagon */}
          <path
            d="M24 6L38.5 15V33L24 42L9.5 33V15L24 6Z"
            fill={variant === 'gradient' ? 'url(#logo-gradient)' : color}
            fillOpacity="0.1"
            stroke={variant === 'gradient' ? 'url(#logo-gradient)' : color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          
          {/* Center Icon - GSO Letters */}
          <g transform="translate(12, 18)">
            {/* G */}
            <path
              d="M6 3C3.5 3 2 4.5 2 7C2 9.5 3.5 11 6 11H7V8H5"
              stroke={variant === 'gradient' ? 'url(#logo-gradient)' : color}
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* S */}
            <path
              d="M10 3C10 3 12 3 12 4.5C12 6 10 7 10 7C10 7 12 8 12 9.5C12 11 10 11 10 11"
              stroke={variant === 'gradient' ? 'url(#logo-gradient)' : color}
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* O */}
            <circle
              cx="18"
              cy="7"
              r="4"
              stroke={variant === 'gradient' ? 'url(#logo-gradient)' : color}
              strokeWidth="1.5"
              fill="none"
            />
          </g>
          
          {/* Orbiting Dots */}
          <circle
            cx="24"
            cy="4"
            r="2"
            fill={variant === 'gradient' ? '#6366f1' : color}
            className="animate-orbit"
            style={{ transformOrigin: '24px 24px' }}
          />
          <circle
            cx="44"
            cy="24"
            r="2"
            fill={variant === 'gradient' ? '#8b5cf6' : color}
            className="animate-orbit"
            style={{ transformOrigin: '24px 24px', animationDelay: '5s' }}
          />
          <circle
            cx="24"
            cy="44"
            r="2"
            fill={variant === 'gradient' ? '#ec4899' : color}
            className="animate-orbit"
            style={{ transformOrigin: '24px 24px', animationDelay: '10s' }}
          />
        </svg>
        
        {/* Glow Effect */}
        {variant === 'gradient' && (
          <div className="absolute inset-0 blur-xl opacity-50">
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" />
          </div>
        )}
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black ${text} tracking-tight leading-none ${
            variant === 'gradient' ? 'gradient-text' : 
            variant === 'white' ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>
            SideGSO
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 tracking-widest uppercase">
            AI-Ready Content
          </span>
        </div>
      )}
    </div>
  )
}

// Animated Background Pattern
export function BrandPattern({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="brand-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="#6366f1" opacity="0.5" />
              <circle cx="0" cy="0" r="1.5" fill="#8b5cf6" opacity="0.5" />
              <circle cx="40" cy="0" r="1.5" fill="#8b5cf6" opacity="0.5" />
              <circle cx="0" cy="40" r="1.5" fill="#8b5cf6" opacity="0.5" />
              <circle cx="40" cy="40" r="1.5" fill="#8b5cf6" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#brand-pattern)" />
        </svg>
      </div>
      
      {/* Animated Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 blob bg-gradient-to-r from-purple-400 to-pink-400 opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 blob bg-gradient-to-r from-blue-400 to-indigo-400 opacity-20" 
        style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 blob bg-gradient-to-r from-pink-400 to-purple-400 opacity-20" 
        style={{ animationDelay: '4s' }} />
    </div>
  )
}