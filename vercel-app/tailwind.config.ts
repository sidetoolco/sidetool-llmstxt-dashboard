import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fin.ai inspired deep-space palette
        'fin': {
          'black': '#050505',
          'midnight': '#0A0A0F',
          'dark': '#0D1117',
          'orange': '#FF5600',
          'cream': '#FAF8F5',
          'white': '#FFFFFF',
        },
        'fin-text': {
          'primary': 'rgba(255, 255, 255, 1)',
          'secondary': 'rgba(255, 255, 255, 0.8)',
          'tertiary': 'rgba(255, 255, 255, 0.6)',
          'muted': 'rgba(255, 255, 255, 0.4)',
        },
        'fin-border': {
          'default': 'rgba(255, 255, 255, 0.1)',
          'hover': 'rgba(255, 255, 255, 0.25)',
          'active': 'rgba(255, 86, 0, 0.5)',
        },
        // Status colors
        'status': {
          'success': '#10B981',
          'warning': '#FF5600',
          'error': '#EF4444',
          'processing': '#3B82F6',
        },
        // Legacy mappings for gradual migration
        'ray': {
          'red': '#FF5600',
          'black': '#050505',
          'gray': {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#E5E5E5',
            300: '#D4D4D4',
            400: '#A3A3A3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
            950: '#0A0A0A',
          },
          'blue': '#3B82F6',
          'green': '#10B981',
          'orange': '#FF5600',
        }
      },
      fontFamily: {
        'serif': ['Crimson Text', 'Georgia', 'serif'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xxs': ['10px', '14px'],
        'meta': ['11px', '16px'],
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
        '5xl': ['48px', '48px'],
        '6xl': ['60px', '60px'],
        '7xl': ['72px', '72px'],
        '8xl': ['96px', '96px'],
      },
      letterSpacing: {
        'meta': '0.12em',
        'wide': '0.02em',
        'wider': '0.04em',
        'widest': '0.08em',
        'tighter': '-0.04em',
        'tight': '-0.03em',
      },
      lineHeight: {
        'none': '0.9',
        'tight': '1.1',
        'snug': '1.3',
        'normal': '1.6',
        'relaxed': '1.7',
        'loose': '2',
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        'full': '9999px',
      },
      animation: {
        'nebula-drift': 'nebula-drift 30s ease-in-out infinite',
        'pulse': 'pulse 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
        'marquee': 'marquee 20s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'draw': 'draw 2s ease-out forwards',
        'reveal': 'reveal 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        'nebula-drift': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(10%, -10%) rotate(120deg)' },
          '66%': { transform: 'translate(-10%, 10%) rotate(240deg)' },
        },
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'spin': {
          'to': { transform: 'rotate(360deg)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'draw': {
          'to': { strokeDashoffset: '0' },
        },
        'reveal': {
          'from': { 
            opacity: '0.001',
            filter: 'blur(5px)',
            transform: 'translateY(20px)'
          },
          'to': { 
            opacity: '1',
            filter: 'blur(0)',
            transform: 'translateY(0)'
          },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slideDown': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scaleIn': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glowPulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 86, 0, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 86, 0, 0.8)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'space-gradient': 'linear-gradient(180deg, #050505 0%, #0D1117 100%)',
        'nebula': 'radial-gradient(circle at 30% 50%, rgba(255, 86, 0, 0.15) 0%, transparent 50%)',
        'grid-dots': 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
        'fade-edge': 'linear-gradient(to bottom, transparent 0%, #050505 85%)',
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
      boxShadow: {
        'glow-orange': '0 0 40px rgba(255, 86, 0, 0.3)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.1)',
        'glow-intense': '0 0 60px rgba(255, 86, 0, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(255, 86, 0, 0.2)',
        'ray': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'ray-md': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'ray-lg': '0 4px 12px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      transitionDuration: {
        '0': '0ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      maxWidth: {
        'container': '1600px',
        'container-mobile': '916px',
      },
    },
  },
  plugins: [],
}
export default config