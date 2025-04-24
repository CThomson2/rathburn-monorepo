import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: {
      origin: ["http://localhost:3001", "https://rathburn.app", "http://localhost:4173"],
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    proxy: {
      // Proxy API requests to the Express backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173,
    cors: {
      origin: ["http://localhost:3001", "https://rathburn.app"],
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    proxy: {
      // Proxy API requests to the Express backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Barcode Scanner",
        short_name: "Scanner",
        description: "Barcode Scanner PWA for Keyboard Wedge Scanners",
        theme_color: "#3B82F6",
        background_color: "#3B82F6",
        display: "standalone",
        orientation: "portrait",
        icons: [
          // {
          //   src: "/icon-web.png",
          //   sizes: "64x64",
          //   type: "image/png",
          // },
          {
            src: "/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
          },
          // {
          //   src: "/placeholder.svg",
          //   sizes: "192x192",
          //   type: "image/svg+xml",
          //   purpose: "any maskable",
          // },
          // {
          //   src: "/placeholder.svg",
          //   sizes: "512x512",
          //   type: "image/svg+xml",
          //   purpose: "any maskable",
          // },
        ],
        start_url: "/",
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              fetchOptions: {
                credentials: "include",
              },
            },
          },
          {
            urlPattern: /^https:\/\/rathburn\.app\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
              fetchOptions: {
                credentials: "include",
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // No exclusions needed
  },
}));
