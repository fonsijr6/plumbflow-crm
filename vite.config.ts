import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Plumiks CRM",
        short_name: "Plumiks",
        description: "CRM para autónomos",
        theme_color: "#2563eb",
        background_color: "#2563eb",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],

  // ✅ ✅ ESTO ES LO QUE FALTABA
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
