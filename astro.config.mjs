import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://codexhelper.com',
  base: '/',
  integrations: [
    svelte(),
    sitemap({
      // Customize sitemap options
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  vite: {
    define: {
      'import.meta.env.PUBLIC_DISCORD_APP_ID': JSON.stringify(process.env.PUBLIC_DISCORD_APP_ID || '1434105087722258573'),
    }
  }
});