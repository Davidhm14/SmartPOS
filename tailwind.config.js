/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/src/**/*.{js,jsx,ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
        th: {
          bg:  'var(--th-bg)',
          s:   'var(--th-s)',
          s2:  'var(--th-s2)',
          s3:  'var(--th-s3)',
          b:   'var(--th-b)',
          b2:  'var(--th-b2)',
          b3:  'var(--th-b3)',
          t:   'var(--th-t)',
          t2:  'var(--th-t2)',
          t3:  'var(--th-t3)',
          t4:  'var(--th-t4)',
        }
      }
    }
  },
  plugins: []
}
