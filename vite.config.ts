import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The API only allows this origin through CORS (Cors:AllowedOrigins), so the port is fixed.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
