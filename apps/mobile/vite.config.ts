import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import type { Plugin, UserConfig } from 'vite'

// Create a separate optimizeDeps configuration to avoid type errors
const optimizeDepsConfig = {
  esbuildOptions: {
    define: {
      global: 'globalThis'
    },
    plugins: [
      NodeGlobalsPolyfillPlugin({
        process: true
      })
    ]
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  const isProd = mode === 'production';
  
  // Define origins based on environment
  const corsOrigins = isProd 
    ? ["https://rathburn.app", "https://mobile.rathburn.app"] 
    : ["http://localhost:3001", "https://rathburn.app", "http://localhost:4173"];

  const config: UserConfig = {
    // Avoid bundling multiple React copies in monorepo
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        process: 'process/browser',
        // Resolve workspace packages
        '@rathburn/ui': path.resolve(__dirname, '../../packages/ui'),
        // Fix Three.js imports
        'three/addons/': path.resolve(__dirname, './node_modules/three/examples/jsm/'),
      },
      dedupe: ['react', 'react-dom', 'three'],
    },
    base: isProd ? '/' : '/',
    build: {
      sourcemap: !isProd,
      minify: isProd,
      cssMinify: isProd,
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      commonjsOptions: {
        include: [/node_modules/, /packages\/ui/],
      },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react/jsx-runtime'],
            three: ['three'],
          },
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`
        },
        // In production, bundle the UI package
        external: isProd ? [] : [],
        // Make sure packages are properly included
        preserveEntrySignatures: 'strict',
      }
    },
    server: {
      host: "::",
      port: 8080,
      cors: {
        origin: corsOrigins,
        credentials: true,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
      },
      proxy: {
        // Proxy API requests to the Express backend (development only)
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      },
      hmr: {
        // Fix for WebSocket connection issues in development mode
        host: 'localhost',
        protocol: 'ws'
      }
    },
    preview: {
      port: 4173,
      cors: {
        origin: corsOrigins,
        credentials: true,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
      },
      proxy: isProd ? {} : {
        // Proxy API requests to the Express backend (development only)
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
      isProd && VitePWA({
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
            {
              src: "/app-icon/favicon.ico",
              sizes: "64x64",
              type: "image/x-icon",
            },
            {
              src: "/app-icon/android-icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/app-icon/apple-icon-180x180.png",
              sizes: "180x180",
              type: "image/png",
            },
            {
              src: "/app-icon/android-icon-144x144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "/app-icon/favicon-96x96.png",
              sizes: "96x96",
              type: "image/png",
            },
            {
              src: "/app-icon/favicon-32x32.png",
              sizes: "32x32",
              type: "image/png",
            },
            {
              src: "/app-icon/favicon-16x16.png",
              sizes: "16x16",
              type: "image/png",
            },
          ],
          start_url: "/",
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
    ].filter(Boolean) as Plugin[],
  };

  // Add the optimizeDeps configuration using type assertion to bypass type checking
  config.optimizeDeps = {
    ...optimizeDepsConfig.esbuildOptions,
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime', 
      'react/jsx-dev-runtime',
      // Include workspace packages 
      '@rathburn/ui',
      // Remove optimizeDeps for Three.js since it causes issues
    ],
    // Don't exclude workspace packages
    exclude: ['three', '@react-three/fiber', '@react-spring/three']
  };

  return config;
});
