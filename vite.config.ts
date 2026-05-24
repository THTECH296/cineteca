import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base '/cineteca/' no build (GitHub Pages em /cineteca/); '/' no dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cineteca/' : '/',
  plugins: [react()],
}))
