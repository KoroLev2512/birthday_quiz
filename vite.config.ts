import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Serve the raw asset folder (frames + audio) as static files at the site root,
  // so /Сцена 0/1 кадр.png resolves without duplicating ~1.5 GB into public/.
  publicDir: 'files',
  plugins: [react(), tailwindcss()],
});
