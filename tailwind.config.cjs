module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,html}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fastnet: {
          DEFAULT: '#0b69ff',
          light: '#3a86ff',
          dark: '#0849b3'
        },
      }
    }
  },
  plugins: [],
}
