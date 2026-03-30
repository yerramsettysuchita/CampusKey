/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#050710',
          900: '#0a0e1a',
          800: '#1a1f2e',
          700: '#2a2f3e',
          600: '#3a4050',
        },
        ice: {
          50:  '#f0f4ff',
          100: '#e0e8f8',
          200: '#c0d4ee',
          300: '#a0c0e0',
          400: '#80a8d0',
          500: '#6090b8',
        },
      },
      animation: {
        'float-a'   : 'floatA 9s ease-in-out infinite',
        'float-b'   : 'floatB 7s ease-in-out infinite 1.5s',
        'float-c'   : 'floatC 11s ease-in-out infinite 3s',
        'float-d'   : 'floatD 8s ease-in-out infinite 0.5s',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer'   : 'shimmer 1.6s linear infinite',
        'toast-in'  : 'toastIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
      },
      keyframes: {
        floatA: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(30px,-25px) scale(1.04)' },
        },
        floatB: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(-20px,30px) scale(0.97)' },
        },
        floatC: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(15px,-35px) scale(1.03)' },
        },
        floatD: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(-25px,20px) scale(1.02)' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.5', filter: 'blur(40px)' },
          '50%':     { opacity: '0.8', filter: 'blur(50px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-300% center' },
          '100%': { backgroundPosition:  '300% center' },
        },
        toastIn: {
          '0%':   { opacity: '0', transform: 'translateY(-8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

