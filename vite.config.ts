import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'path'

const isMobile = process.env.VITE_TARGET === 'mobile' || process.env.TARGET === 'mobile'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    ...(!isMobile
      ? [
          electron([
            {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: [
                      '@prisma/client',
                      '../src/generated/prisma-client',
                      'xlsx',
                      'pdfjs-dist',
                      'pdfjs-dist/legacy/build/pdf.mjs',
                    ],
                  },
                },
              },
            },
            {
              entry: 'electron/preload.ts',
              onstart(args) {
                args.reload()
              },
              vite: {
                build: {
                  outDir: 'dist-electron',
                },
              },
            },
          ]),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5252,
    strictPort: true,
  },
})
