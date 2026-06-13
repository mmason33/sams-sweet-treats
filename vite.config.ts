/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this project at https://mmason33.github.io/sams-sweet-treats/,
// so the production build is based under that path. Dev/preview run at the root.
// When the custom (Squarespace) domain is connected at the root, change BUILD_BASE to '/'.
const BUILD_BASE = '/sams-sweet-treats/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BUILD_BASE : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
}))
