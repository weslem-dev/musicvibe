import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // O CORS do backend só libera http://localhost:5173. Com strictPort o Vite
    // falha se a porta estiver ocupada, em vez de subir silenciosamente na 5174.
    port: 5173,
    strictPort: true,
  },
})
