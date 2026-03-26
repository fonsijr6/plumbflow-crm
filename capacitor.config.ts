import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.plumiks",
  appName: "Plumiks CRM",
  webDir: "dist",
  server: {
    url: "https://www.plumiks.com", // ✅ Aquí cargará tu web
    cleartext: true,
  },
};

export default config;
