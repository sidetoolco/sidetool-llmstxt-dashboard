import React from 'react'

interface RayLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function RayLogo({ 
  size = 'md', 
  showText = true,
  className = '' 
}: RayLogoProps) {
  const sizes = {
    sm: { icon: 20, text: 'text-sm' },
    md: { icon: 28, text: 'text-base' },
    lg: { icon: 36, text: 'text-lg' }
  }
  
  const { icon, text } = sizes[size]
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Minimalist Icon */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: icon, height: icon }}
      >
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ray burst effect */}
          <g opacity="0.8">
            <path d="M16 8L17.5 2L16 0L14.5 2L16 8Z" fill="#FF6363" />
            <path d="M24 16L30 14.5L32 16L30 17.5L24 16Z" fill="#FF6363" />
            <path d="M16 24L14.5 30L16 32L17.5 30L16 24Z" fill="#FF6363" />
            <path d="M8 16L2 17.5L0 16L2 14.5L8 16Z" fill="#FF6363" />
          </g>
          
          {/* Center circle */}
          <circle cx="16" cy="16" r="6" fill="#FF6363" />
          
          {/* Letter S */}
          <path 
            d="M14 13.5C14 12.7 14.7 12 15.5 12C16.3 12 17 12.7 17 13.5C17 14.3 16.3 15 15.5 15H16.5C17.3 15 18 15.7 18 16.5C18 17.3 17.3 18 16.5 18C15.7 18 15 17.3 15 16.5" 
            stroke="white" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
      
      {showText && (
        <span className={`font-medium tracking-tight text-white ${text}`}>
          SideGSO
        </span>
      )}
    </div>
  )
}

export function RayLogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#000000" />
      <g opacity="0.6">
        <path d="M16 10L17 6L16 4L15 6L16 10Z" fill="#FF6363" />
        <path d="M22 16L26 15L28 16L26 17L22 16Z" fill="#FF6363" />
        <path d="M16 22L15 26L16 28L17 26L16 22Z" fill="#FF6363" />
        <path d="M10 16L6 17L4 16L6 15L10 16Z" fill="#FF6363" />
      </g>
      <circle cx="16" cy="16" r="4" fill="#FF6363" />
    </svg>
  )
}