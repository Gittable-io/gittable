import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default defineConfig({
  main: {
    // See src/main/polyfills/crypto.js to explain why I added build{} to the main{} config
    build: {
      rollupOptions: {
        output: {
          globals: { crypto: "crypto" },
        },
        external: ["crypto"],
        plugins: [nodeResolve({ preferBuiltins: true })],
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [react()],
  },
});
