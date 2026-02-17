import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://codexhelper.com',
  base: '/',
  integrations: [
    svelte(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  server: {
    host: true,
  },
  vite: {
    define: {
      'import.meta.env.PUBLIC_DISCORD_APP_ID': JSON.stringify(process.env.PUBLIC_DISCORD_APP_ID || '1434105087722258573'),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/xlsx')) return 'vendor-xlsx';
            if (id.includes('node_modules/svelte')) return 'vendor-svelte';
          }
        }
      },
      chunkSizeWarningLimit: 600,
    }
  }
});