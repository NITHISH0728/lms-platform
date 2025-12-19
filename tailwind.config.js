/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iqBlue: '#005EB8',
        iqGreen: '#87C232',
      },
    },
  },
  plugins: [],
}