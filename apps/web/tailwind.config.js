/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease both',
        'fade-in-up': 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-down': 'slideDown 0.4s ease both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse-red': 'glowPulseRed 2s ease-in-out infinite',
        'glow-pulse-blue': 'glowPulseBlue 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulseRed: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(239,68,68,0)', borderColor: 'rgba(239,68,68,0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(239,68,68,0.25), 0 0 60px rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.4)' },
        },
        glowPulseBlue: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(59,130,246,0)' },
          '50%': { boxShadow: '0 0 25px rgba(59,130,246,0.35), 0 0 50px rgba(59,130,246,0.1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}