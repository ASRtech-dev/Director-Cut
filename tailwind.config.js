/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F1115',
        surface: '#1A1D24',
        surfaceHighlight: '#232730',
        primary: '#4F46E5',
        primaryHover: '#6366F1',
        textMain: '#FFFFFF',
        textMuted: '#CBD5E1',
        border: '#2E3340',
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      }
    },
  },
  plugins: [],
}
