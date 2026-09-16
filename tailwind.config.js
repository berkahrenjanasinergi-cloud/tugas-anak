/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        card: '#FFFFFF',
        ink: '#2B2B33',
        'ink-soft': '#6b6b76',
        miqa: '#FF6FA5',
        'miqa-soft': '#FFE1ED',
        irgi: '#2F98D4',
        'irgi-soft': '#DCF0FB',
        violet: '#8C5DD1',
        'violet-soft': '#EDE3FB',
        sun: '#FFB627',
        'sun-soft': '#FFF1D2',
        green: '#3FB27F',
        line: '#EFE7DA',
      },
      fontFamily: {
        'baloo': ['Baloo 2', 'sans-serif'],
        'nunito': ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}