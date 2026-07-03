import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base = имя репозитория, чтобы сайт работал на GitHub Pages
// (https://<владелец>.github.io/DranikPesApp/)
export default defineConfig({
  base: '/DranikPesApp/',
  plugins: [react(), tailwindcss()],
})
