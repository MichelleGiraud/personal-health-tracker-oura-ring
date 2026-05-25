import { defineConfig } from "vitest/config";
import { resolve } from "path"; //ruta absoluta en relativa 

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
