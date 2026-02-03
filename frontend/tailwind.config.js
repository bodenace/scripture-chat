/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors for a warm, faith-inspired theme
      colors: {
        primary: {
          50: '#fef7ed',
          100: '#fdecd4',
          200: '#fad5a8',
          300: '#f6b871',
          400: '#f19038',
          500: '#ed7412',
          600: '#de5a08',
          700: '#b84209',
          800: '#93350f',
          900: '#772d10',
          950: '#401406',
        },
        scripture: {
          gold: '#D4A574',
          cream: '#FDF8F3',
          brown: '#8B4513',
          navy: '#1e3a5f',
        }
      },
      // Larger font sizes for accessibility (55+ audience)
      fontSize: {
        'base': ['18px', '1.75'],     // Base text larger
        'lg': ['20px', '1.75'],
        'xl': ['24px', '1.5'],
        '2xl': ['28px', '1.4'],
        '3xl': ['32px', '1.3'],
        '4xl': ['40px', '1.2'],
      },
      // Comfortable spacing
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // Font family - readable, classic
      fontFamily: {
        sans: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        display: ['Georgia', 'serif'],
      },
      // Border radius for softer look
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      // Box shadows
      boxShadow: {
        'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 6px 20px 0 rgba(0, 0, 0, 0.12)',
      },
      // Animation (minimal for accessibility)
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
