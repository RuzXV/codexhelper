// Minimal mock for Hono's Context object used in error handler tests
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export interface MockJsonCall {
    body: unknown;
    status: number;
}

export function createMockContext() {
    const jsonCalls: MockJsonCall[] = [];

    const c = {
        req: {
            json: async () => ({}),
            header: (_name: string) => '',
        },
        json: (body: unknown, status?: ContentfulStatusCode) => {
            const s = status ?? 200;
            jsonCalls.push({ body, status: s });
            return new Response(JSON.stringify(body), { status: s });
        },
        env: {
            BOT_DB: {} as unknown,
            DB: {} as unknown,
            API_CACHE: {} as unknown,
            BOT_DATA: {} as unknown,
            MASTER_ADMIN_IDS: '',
        },
        get: (_key: string) => ({ id: 'test-user', username: 'tester', accessToken: 'tok' }),
        executionCtx: { waitUntil: () => {} },
    };

    return { c: c as unknown, jsonCalls };
}
