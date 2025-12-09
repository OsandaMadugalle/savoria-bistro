import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite automatically exposes env variables starting with VITE_ via import.meta.env
  // No need to manually define them here
});
});