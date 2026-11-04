import { defineConfig } from 'vite';

// Relative base so the build works from https://<owner>.github.io/<repo>/ or /preview/<version>/
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 1600 },
});
