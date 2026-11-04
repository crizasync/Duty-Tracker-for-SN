import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import pwa from './pwa-plugin.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), pwa()],
});
