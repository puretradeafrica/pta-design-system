import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "demo",
  publicDir: "public",
  plugins: [react()],
  server: { port: 5273, strictPort: true },
});
