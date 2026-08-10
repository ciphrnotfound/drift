import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { drift } from '@drift/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    drift({
      tokensPath: './drift.tokens',
    }),
  ],
})
