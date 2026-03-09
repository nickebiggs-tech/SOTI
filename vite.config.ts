import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/SOTI/',
  define: {
    __BUILD_TIME__: JSON.stringify(Date.now()),
  },
})
