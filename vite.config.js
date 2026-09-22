import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { atlasIndex } from './tools/atlas-index.mjs'

const here = (file) => fileURLToPath(new URL(file, import.meta.url))

export default defineConfig({
  plugins: [react(), atlasIndex()],
  build: {
    // Two pages: the landing page with the tree, and the microscope. They share
    // nothing but the fonts' stylesheet, and must not share a script either —
    // `npm run share` folds the microscope into one file by inlining the
    // scripts its page names, and a chunk it imported on the side would be left
    // behind. The module-preload polyfill is the one script Vite would otherwise
    // put in common; every browser that runs the atlas has modulepreload anyway.
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        index: here('index.html'),
        microscope: here('microscope.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
