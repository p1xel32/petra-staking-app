import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/explorer-api': {
        target: 'https://explorer.mainnet.aptoslabs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/explorer-api/, '/graphql'),
      },
    },
  },
})
