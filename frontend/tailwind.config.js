/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        health: {
          regular: '#ef4444', // Vermelho
          suficiente: '#eab308', // Amarelo
          bom: '#22c55e', // Verde
          otimo: '#3b82f6', // Azul
        },
        background: "#f8fafc",
        card: "#ffffff",
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
