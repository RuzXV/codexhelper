import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            include: ['functions/api/**/*.ts'],
            exclude: ['functions/api/routes/**'],
        },
    },
    resolve: {
        alias: {
            '@cloudflare/workers-types': './tests/mocks/cloudflare-types.ts',
        },
    },
});
