import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://codexhelper.com',
  base: '/',
  integrations: [svelte()],
  vite: {
    define: {
      'import.meta.env.PUBLIC_DISCORD_APP_ID': JSON.stringify(process.env.PUBLIC_DISCORD_APP_ID || '1434105087722258573'),
    }
  }
});