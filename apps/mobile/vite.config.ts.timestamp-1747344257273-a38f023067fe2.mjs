// vite.config.ts
import { defineConfig } from "file:///Users/conrad/Documents/apps/rathburn-monorepo/apps/mobile/node_modules/vite/dist/node/index.js";
import react from "file:///Users/conrad/Documents/apps/rathburn-monorepo/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///Users/conrad/Documents/apps/rathburn-monorepo/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///Users/conrad/Documents/apps/rathburn-monorepo/node_modules/vite-plugin-pwa/dist/index.js";
import { NodeGlobalsPolyfillPlugin } from "file:///Users/conrad/Documents/apps/rathburn-monorepo/node_modules/@esbuild-plugins/node-globals-polyfill/dist/index.js";
var __vite_injected_original_dirname = "/Users/conrad/Documents/apps/rathburn-monorepo/apps/mobile";
var optimizeDepsConfig = {
  esbuildOptions: {
    define: {
      global: "globalThis"
    },
    plugins: [
      NodeGlobalsPolyfillPlugin({
        process: true
      })
    ]
  }
};
var vite_config_default = defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const corsOrigins = isProd ? ["https://rathburn.app", "https://mobile.rathburn.app"] : ["http://localhost:3001", "https://rathburn.app", "http://localhost:4173"];
  const config = {
    // Avoid bundling multiple React copies in monorepo
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src"),
        process: "process/browser",
        // Resolve workspace packages
        "@rathburn/ui": path.resolve(__vite_injected_original_dirname, "../../packages/ui"),
        // Fix Three.js imports
        "three/addons/": path.resolve(__vite_injected_original_dirname, "./node_modules/three/examples/jsm/")
      },
      dedupe: ["react", "react-dom", "three"]
    },
    base: isProd ? "/" : "/",
    build: {
      sourcemap: !isProd,
      minify: isProd,
      cssMinify: isProd,
      target: "esnext",
      outDir: "dist",
      assetsDir: "assets",
      commonjsOptions: {
        include: [/node_modules/, /packages\/ui/]
      },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react/jsx-runtime"],
            three: ["three"]
          },
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`
        },
        // In production, bundle the UI package
        external: isProd ? [] : [],
        // Make sure packages are properly included
        preserveEntrySignatures: "strict"
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
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false
        }
      },
      hmr: {
        // Fix for WebSocket connection issues in development mode
        host: "localhost",
        protocol: "ws"
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
        "/api": {
          target: "http://localhost:3001",
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
              type: "image/x-icon"
            },
            {
              src: "/app-icon/android-icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/app-icon/apple-icon-180x180.png",
              sizes: "180x180",
              type: "image/png"
            },
            {
              src: "/app-icon/android-icon-144x144.png",
              sizes: "144x144",
              type: "image/png"
            },
            {
              src: "/app-icon/favicon-96x96.png",
              sizes: "96x96",
              type: "image/png"
            },
            {
              src: "/app-icon/favicon-32x32.png",
              sizes: "32x32",
              type: "image/png"
            },
            {
              src: "/app-icon/favicon-16x16.png",
              sizes: "16x16",
              type: "image/png"
            }
          ],
          start_url: "/"
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
                  maxAgeSeconds: 60 * 60 * 24
                },
                fetchOptions: {
                  credentials: "include"
                }
              }
            },
            {
              urlPattern: /^https:\/\/rathburn\.app\/api\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60
                },
                fetchOptions: {
                  credentials: "include"
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ].filter(Boolean)
  };
  config.optimizeDeps = {
    ...optimizeDepsConfig.esbuildOptions,
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      // Include workspace packages 
      "@rathburn/ui"
      // Remove optimizeDeps for Three.js since it causes issues
    ],
    // Don't exclude workspace packages
    exclude: ["three", "@react-three/fiber", "@react-spring/three"]
  };
  return config;
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvY29ucmFkL0RvY3VtZW50cy9hcHBzL3JhdGhidXJuLW1vbm9yZXBvL2FwcHMvbW9iaWxlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvY29ucmFkL0RvY3VtZW50cy9hcHBzL3JhdGhidXJuLW1vbm9yZXBvL2FwcHMvbW9iaWxlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9jb25yYWQvRG9jdW1lbnRzL2FwcHMvcmF0aGJ1cm4tbW9ub3JlcG8vYXBwcy9tb2JpbGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XG5pbXBvcnQgeyBOb2RlR2xvYmFsc1BvbHlmaWxsUGx1Z2luIH0gZnJvbSAnQGVzYnVpbGQtcGx1Z2lucy9ub2RlLWdsb2JhbHMtcG9seWZpbGwnXG5pbXBvcnQgdHlwZSB7IFBsdWdpbiwgVXNlckNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5cbi8vIENyZWF0ZSBhIHNlcGFyYXRlIG9wdGltaXplRGVwcyBjb25maWd1cmF0aW9uIHRvIGF2b2lkIHR5cGUgZXJyb3JzXG5jb25zdCBvcHRpbWl6ZURlcHNDb25maWcgPSB7XG4gIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgZGVmaW5lOiB7XG4gICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJ1xuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgTm9kZUdsb2JhbHNQb2x5ZmlsbFBsdWdpbih7XG4gICAgICAgIHByb2Nlc3M6IHRydWVcbiAgICAgIH0pXG4gICAgXVxuICB9XG59O1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSk6IFVzZXJDb25maWcgPT4ge1xuICBjb25zdCBpc1Byb2QgPSBtb2RlID09PSAncHJvZHVjdGlvbic7XG4gIFxuICAvLyBEZWZpbmUgb3JpZ2lucyBiYXNlZCBvbiBlbnZpcm9ubWVudFxuICBjb25zdCBjb3JzT3JpZ2lucyA9IGlzUHJvZCBcbiAgICA/IFtcImh0dHBzOi8vcmF0aGJ1cm4uYXBwXCIsIFwiaHR0cHM6Ly9tb2JpbGUucmF0aGJ1cm4uYXBwXCJdIFxuICAgIDogW1wiaHR0cDovL2xvY2FsaG9zdDozMDAxXCIsIFwiaHR0cHM6Ly9yYXRoYnVybi5hcHBcIiwgXCJodHRwOi8vbG9jYWxob3N0OjQxNzNcIl07XG5cbiAgY29uc3QgY29uZmlnOiBVc2VyQ29uZmlnID0ge1xuICAgIC8vIEF2b2lkIGJ1bmRsaW5nIG11bHRpcGxlIFJlYWN0IGNvcGllcyBpbiBtb25vcmVwb1xuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgICAgIHByb2Nlc3M6ICdwcm9jZXNzL2Jyb3dzZXInLFxuICAgICAgICAvLyBSZXNvbHZlIHdvcmtzcGFjZSBwYWNrYWdlc1xuICAgICAgICAnQHJhdGhidXJuL3VpJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uL3BhY2thZ2VzL3VpJyksXG4gICAgICAgIC8vIEZpeCBUaHJlZS5qcyBpbXBvcnRzXG4gICAgICAgICd0aHJlZS9hZGRvbnMvJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3RocmVlL2V4YW1wbGVzL2pzbS8nKSxcbiAgICAgIH0sXG4gICAgICBkZWR1cGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3RocmVlJ10sXG4gICAgfSxcbiAgICBiYXNlOiBpc1Byb2QgPyAnLycgOiAnLycsXG4gICAgYnVpbGQ6IHtcbiAgICAgIHNvdXJjZW1hcDogIWlzUHJvZCxcbiAgICAgIG1pbmlmeTogaXNQcm9kLFxuICAgICAgY3NzTWluaWZ5OiBpc1Byb2QsXG4gICAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgICAgY29tbW9uanNPcHRpb25zOiB7XG4gICAgICAgIGluY2x1ZGU6IFsvbm9kZV9tb2R1bGVzLywgL3BhY2thZ2VzXFwvdWkvXSxcbiAgICAgIH0sXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgcmVhY3Q6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0L2pzeC1ydW50aW1lJ10sXG4gICAgICAgICAgICB0aHJlZTogWyd0aHJlZSddLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6IGBhc3NldHMvW25hbWVdLltoYXNoXS5qc2AsXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6IGBhc3NldHMvW25hbWVdLltoYXNoXS5qc2AsXG4gICAgICAgICAgYXNzZXRGaWxlTmFtZXM6IGBhc3NldHMvW25hbWVdLltoYXNoXS5bZXh0XWBcbiAgICAgICAgfSxcbiAgICAgICAgLy8gSW4gcHJvZHVjdGlvbiwgYnVuZGxlIHRoZSBVSSBwYWNrYWdlXG4gICAgICAgIGV4dGVybmFsOiBpc1Byb2QgPyBbXSA6IFtdLFxuICAgICAgICAvLyBNYWtlIHN1cmUgcGFja2FnZXMgYXJlIHByb3Blcmx5IGluY2x1ZGVkXG4gICAgICAgIHByZXNlcnZlRW50cnlTaWduYXR1cmVzOiAnc3RyaWN0JyxcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODA4MCxcbiAgICAgIGNvcnM6IHtcbiAgICAgICAgb3JpZ2luOiBjb3JzT3JpZ2lucyxcbiAgICAgICAgY3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgIG1ldGhvZHM6IFtcIkdFVFwiLCBcIlBPU1RcIiwgXCJPUFRJT05TXCJdLFxuICAgICAgICBhbGxvd2VkSGVhZGVyczogW1wiQ29udGVudC1UeXBlXCIsIFwiQXV0aG9yaXphdGlvblwiXVxuICAgICAgfSxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgIC8vIFByb3h5IEFQSSByZXF1ZXN0cyB0byB0aGUgRXhwcmVzcyBiYWNrZW5kIChkZXZlbG9wbWVudCBvbmx5KVxuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBobXI6IHtcbiAgICAgICAgLy8gRml4IGZvciBXZWJTb2NrZXQgY29ubmVjdGlvbiBpc3N1ZXMgaW4gZGV2ZWxvcG1lbnQgbW9kZVxuICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgcHJvdG9jb2w6ICd3cydcbiAgICAgIH1cbiAgICB9LFxuICAgIHByZXZpZXc6IHtcbiAgICAgIHBvcnQ6IDQxNzMsXG4gICAgICBjb3JzOiB7XG4gICAgICAgIG9yaWdpbjogY29yc09yaWdpbnMsXG4gICAgICAgIGNyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICBtZXRob2RzOiBbXCJHRVRcIiwgXCJQT1NUXCIsIFwiT1BUSU9OU1wiXSxcbiAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFtcIkNvbnRlbnQtVHlwZVwiLCBcIkF1dGhvcml6YXRpb25cIl1cbiAgICAgIH0sXG4gICAgICBwcm94eTogaXNQcm9kID8ge30gOiB7XG4gICAgICAgIC8vIFByb3h5IEFQSSByZXF1ZXN0cyB0byB0aGUgRXhwcmVzcyBiYWNrZW5kIChkZXZlbG9wbWVudCBvbmx5KVxuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksXG4gICAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgICBpc1Byb2QgJiYgVml0ZVBXQSh7XG4gICAgICAgIHJlZ2lzdGVyVHlwZTogXCJwcm9tcHRcIixcbiAgICAgICAgaW5jbHVkZUFzc2V0czogW1wiZmF2aWNvbi5pY29cIiwgXCJyb2JvdHMudHh0XCJdLFxuICAgICAgICBtYW5pZmVzdDoge1xuICAgICAgICAgIG5hbWU6IFwiQmFyY29kZSBTY2FubmVyXCIsXG4gICAgICAgICAgc2hvcnRfbmFtZTogXCJTY2FubmVyXCIsXG4gICAgICAgICAgZGVzY3JpcHRpb246IFwiQmFyY29kZSBTY2FubmVyIFBXQSBmb3IgS2V5Ym9hcmQgV2VkZ2UgU2Nhbm5lcnNcIixcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjM0I4MkY2XCIsXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjM0I4MkY2XCIsXG4gICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgICAgb3JpZW50YXRpb246IFwicG9ydHJhaXRcIixcbiAgICAgICAgICBpY29uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiL2FwcC1pY29uL2Zhdmljb24uaWNvXCIsXG4gICAgICAgICAgICAgIHNpemVzOiBcIjY0eDY0XCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UveC1pY29uXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiL2FwcC1pY29uL2FuZHJvaWQtaWNvbi0xOTJ4MTkyLnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55IG1hc2thYmxlXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiL2FwcC1pY29uL2FwcGxlLWljb24tMTgweDE4MC5wbmdcIixcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTgweDE4MFwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiBcIi9hcHAtaWNvbi9hbmRyb2lkLWljb24tMTQ0eDE0NC5wbmdcIixcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTQ0eDE0NFwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiBcIi9hcHAtaWNvbi9mYXZpY29uLTk2eDk2LnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCI5Nng5NlwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiBcIi9hcHAtaWNvbi9mYXZpY29uLTMyeDMyLnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCIzMngzMlwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiBcIi9hcHAtaWNvbi9mYXZpY29uLTE2eDE2LnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCIxNngxNlwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHN0YXJ0X3VybDogXCIvXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgICBjbGllbnRzQ2xhaW06IHRydWUsXG4gICAgICAgICAgc2tpcFdhaXRpbmc6IHRydWUsXG4gICAgICAgICAgZ2xvYlBhdHRlcm5zOiBbXCIqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Z31cIl0sXG4gICAgICAgICAgbmF2aWdhdGVGYWxsYmFjazogXCJpbmRleC5odG1sXCIsXG4gICAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbL15cXC9hcGlcXC8vXSxcbiAgICAgICAgICBydW50aW1lQ2FjaGluZzogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcLy4qXFwuc3VwYWJhc2VcXC5jb1xcLy4qL2ksXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiTmV0d29ya0ZpcnN0XCIsXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwic3VwYWJhc2UtYXBpLWNhY2hlXCIsXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmZXRjaE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzOiBcImluY2x1ZGVcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9yYXRoYnVyblxcLmFwcFxcL2FwaVxcLy4qL2ksXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiTmV0d29ya0ZpcnN0XCIsXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiYXBpLWNhY2hlXCIsXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmV0Y2hPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICBjcmVkZW50aWFsczogXCJpbmNsdWRlXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZm9udHNcXC5nb29nbGVhcGlzXFwuY29tXFwvLiovaSxcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiZ29vZ2xlLWZvbnRzLWNhY2hlXCIsXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAsXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xuICAgICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLmZpbHRlcihCb29sZWFuKSBhcyBQbHVnaW5bXSxcbiAgfTtcblxuICAvLyBBZGQgdGhlIG9wdGltaXplRGVwcyBjb25maWd1cmF0aW9uIHVzaW5nIHR5cGUgYXNzZXJ0aW9uIHRvIGJ5cGFzcyB0eXBlIGNoZWNraW5nXG4gIGNvbmZpZy5vcHRpbWl6ZURlcHMgPSB7XG4gICAgLi4ub3B0aW1pemVEZXBzQ29uZmlnLmVzYnVpbGRPcHRpb25zLFxuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsIFxuICAgICAgJ3JlYWN0LWRvbScsIFxuICAgICAgJ3JlYWN0L2pzeC1ydW50aW1lJywgXG4gICAgICAncmVhY3QvanN4LWRldi1ydW50aW1lJyxcbiAgICAgIC8vIEluY2x1ZGUgd29ya3NwYWNlIHBhY2thZ2VzIFxuICAgICAgJ0ByYXRoYnVybi91aScsXG4gICAgICAvLyBSZW1vdmUgb3B0aW1pemVEZXBzIGZvciBUaHJlZS5qcyBzaW5jZSBpdCBjYXVzZXMgaXNzdWVzXG4gICAgXSxcbiAgICAvLyBEb24ndCBleGNsdWRlIHdvcmtzcGFjZSBwYWNrYWdlc1xuICAgIGV4Y2x1ZGU6IFsndGhyZWUnLCAnQHJlYWN0LXRocmVlL2ZpYmVyJywgJ0ByZWFjdC1zcHJpbmcvdGhyZWUnXVxuICB9O1xuXG4gIHJldHVybiBjb25maWc7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1csU0FBUyxvQkFBb0I7QUFDN1gsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGVBQWU7QUFDeEIsU0FBUyxpQ0FBaUM7QUFMMUMsSUFBTSxtQ0FBbUM7QUFTekMsSUFBTSxxQkFBcUI7QUFBQSxFQUN6QixnQkFB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
