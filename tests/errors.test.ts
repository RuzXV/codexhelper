import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiError, errors, withErrorHandling } from '../functions/api/_errors';
import { createMockContext } from './mocks/hono-context';

// Suppress console.warn / console.error during tests
beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ─── apiError ──────────────────────────────────────────────────────

describe('apiError', () => {
    it('returns JSON with the correct status code', () => {
        const { c } = createMockContext();
        const res = apiError(c as any, 400, 'Bad input');
        expect(res.status).toBe(400);
    });

    it('uses default message when none provided', () => {
        const { c, jsonCalls } = createMockContext();
        apiError(c as any, 404);
        expect(jsonCalls[0].body).toMatchObject({ error: 'Not Found' });
    });

    it('falls back to generic message for unknown status', () => {
        const { c, jsonCalls } = createMockContext();
        apiError(c as any, 418);
        expect(jsonCalls[0].body).toMatchObject({ error: 'An error occurred' });
    });

    it('includes timestamp in response', () => {
        const { c, jsonCalls } = createMockContext();
        apiError(c as any, 400, 'test');
        expect((jsonCalls[0].body as any).timestamp).toBeDefined();
    });

    it('includes details for 4xx errors', () => {
        const { c, jsonCalls } = createMockContext();
        apiError(c as any, 422, 'Validation', { field: 'name' });
        expect((jsonCalls[0].body as any).details).toEqual({ field: 'name' });
    });

    it('excludes details for 5xx errors', () => {
        const { c, jsonCalls } = createMockContext();
        apiError(c as any, 500, 'Crash', { secret: 'info' });
        expect((jsonCalls[0].body as any).details).toBeUndefined();
    });

    it('logs error for 5xx statuses', () => {
        const { c } = createMockContext();
        apiError(c as any, 503, 'Down', 'extra');
        expect(console.error).toHaveBeenCalled();
    });

    it('logs warning for 4xx statuses', () => {
        const { c } = createMockContext();
        apiError(c as any, 400, 'Bad');
        expect(console.warn).toHaveBeenCalled();
    });
});

// ─── errors helpers ────────────────────────────────────────────────

describe('errors helpers', () => {
    it('badRequest returns 400', () => {
        const { c, jsonCalls } = createMockContext();
        const res = errors.badRequest(c as any);
        expect(res.status).toBe(400);
        expect(jsonCalls[0].body).toMatchObject({ error: 'Invalid request data' });
    });

    it('badRequest accepts custom message', () => {
        const { c, jsonCalls } = createMockContext();
        errors.badRequest(c as any, 'Custom bad');
        expect(jsonCalls[0].body).toMatchObject({ error: 'Custom bad' });
    });

    it('unauthorized returns 401', () => {
        const { c } = createMockContext();
        const res = errors.unauthorized(c as any);
        expect(res.status).toBe(401);
    });

    it('forbidden returns 403', () => {
        const { c } = createMockContext();
        const res = errors.forbidden(c as any);
        expect(res.status).toBe(403);
    });

    it('notFound returns 404 with resource name', () => {
        const { c, jsonCalls } = createMockContext();
        errors.notFound(c as any, 'Guild');
        expect(jsonCalls[0].body).toMatchObject({ error: 'Guild not found' });
    });

    it('notFound returns generic message without resource', () => {
        const { c, jsonCalls } = createMockContext();
        errors.notFound(c as any);
        expect(jsonCalls[0].body).toMatchObject({ error: 'Resource not found' });
    });

    it('conflict returns 409', () => {
        const { c } = createMockContext();
        const res = errors.conflict(c as any);
        expect(res.status).toBe(409);
    });

    it('validation returns 422', () => {
        const { c, jsonCalls } = createMockContext();
        const res = errors.validation(c as any, 'name: Required');
        expect(res.status).toBe(422);
        expect(jsonCalls[0].body).toMatchObject({ error: 'name: Required' });
    });

    it('rateLimit returns 429', () => {
        const { c } = createMockContext();
        const res = errors.rateLimit(c as any);
        expect(res.status).toBe(429);
    });

    it('internal returns 500 and logs error', () => {
        const { c } = createMockContext();
        const res = errors.internal(c as any, new Error('boom'));
        expect(res.status).toBe(500);
        expect(console.error).toHaveBeenCalled();
    });

    it('serviceUnavailable returns 503', () => {
        const { c } = createMockContext();
        const res = errors.serviceUnavailable(c as any);
        expect(res.status).toBe(503);
    });
});

// ─── withErrorHandling ─────────────────────────────────────────────

describe('withErrorHandling', () => {
    it('passes through successful responses', async () => {
        const { c } = createMockContext();
        const handler = withErrorHandling(async () => new Response('ok', { status: 200 }));
        const res = await handler(c as any);
        expect(res.status).toBe(200);
    });

    it('catches thrown errors and returns 500', async () => {
        const { c } = createMockContext();
        const handler = withErrorHandling(async () => {
            throw new Error('unexpected');
        });
        const res = await handler(c as any);
        expect(res.status).toBe(500);
    });
});
