import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 32100,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react')) {
              return 'react';
            }
            if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
              return 'supabase';
            }
            if (id.includes('@radix-ui')) {
              return 'radix';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('react-quill') || id.includes('quill')) {
              return 'editor';
            }
            if (id.includes('antd') || id.includes('dayjs')) {
              return 'antd';
            }
            // All other vendors
            return 'vendor';
          }
        }
      },
    },
  },
}));