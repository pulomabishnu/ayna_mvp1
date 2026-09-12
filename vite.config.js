import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  // Keep implementation/source paths out of the public production artifact.
  // Vite defaults to false, but make the security expectation explicit so a
  // future config change cannot silently publish source maps.
  build: {
    sourcemap: false,
  },
  test: {
    environment: 'node',
  },
})
