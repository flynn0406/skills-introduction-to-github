import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: false,
    strictPort: false,
    cors: true,
    hmr: {
      port: 8081
    }
  }
})