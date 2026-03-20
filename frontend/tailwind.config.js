/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neon cyberpunk palette
        'neon-cyan': '#00f5ff',
        'neon-blue': '#0066ff',
        'neon-purple': '#8b00ff',
        'neon-pink': '#ff00aa',
        'neon-green': '#00ff88',
        'dark-base': '#020817',
        'dark-card': '#060e1f',
        'dark-border': '#0f2040',
        'dark-surface': '#0a1628',
        'glass-bg': 'rgba(6, 14, 31, 0.8)',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'display': ['Orbitron', 'monospace'],
        'body': ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.1)',
        'neon-blue': '0 0 20px rgba(0,102,255,0.5), 0 0 60px rgba(0,102,255,0.15)',
        'neon-purple': '0 0 20px rgba(139,0,255,0.4), 0 0 60px rgba(139,0,255,0.1)',
        'neon-green': '0 0 20px rgba(0,255,136,0.4), 0 0 60px rgba(0,255,136,0.1)',
        'glass': '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)`,
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0,102,255,0.15) 0%, transparent 70%)',
        'cyber-gradient': 'linear-gradient(135deg, #020817 0%, #060e1f 50%, #020817 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'flicker': 'flicker 4s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'type': 'typewriter 2s steps(40) forwards',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,245,255,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0,245,255,0.7), 0 0 80px rgba(0,245,255,0.3)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 95%, 100%': { opacity: '1' },
          '96%, 99%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        typewriter: {
          from: { width: '0' },
          to: { width: '100%' },
        }
      },
    },
  },
  plugins: [],
}
