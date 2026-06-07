import { defineConfig } from 'vite';

// Relative base so the built site works when opened from any static host
// (GitHub Pages, a plain file server, etc.) without path surprises.
export default defineConfig({
  base: './',
  server: { host: true, open: false },
});
