import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: '/legend-quest/', // Standard base for GitHub Pages at https://<user>.github.io/<repo>/
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/tone') || id.includes('node_modules/@tonejs')) {
            return 'tone';
          }
          if (id.includes('node_modules/peerjs')) {
            return 'peerjs';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
