import { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { Bindings, Variables, ApiErrorResponse } from './_types';

// Use a broad context type so error helpers work in both user-auth and bot-auth routes
type AppContext = Context<{ Bindings: Bindings; Variables?: Variables }>;

const ERROR_MESSAGES: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
};

export function apiError(
    c: AppContext,
    status: number,
    message?: string,
    details?: unknown
) {
    const errorMessage = message || ERROR_MESSAGES[status] || 'An error occurred';

    if (status >= 500) {
        console.error(`[${status}] ${errorMessage}`, details);
    } else if (status >= 400) {
        console.warn(`[${status}] ${errorMessage}`);
    }

    const response: ApiErrorResponse = {
        error: errorMessage,
        timestamp: new Date().toISOString(),
    };

    if (details && status < 500) {
        response.details = details;
    }

    return c.json(response, status as ContentfulStatusCode);
}

export const errors = {
    badRequest: (c: AppContext, message?: string, details?: unknown) =>
        apiError(c, 400, message || 'Invalid request data', details),

    unauthorized: (c: AppContext, message?: string) =>
        apiError(c, 401, message || 'Authentication required'),

    forbidden: (c: AppContext, message?: string) =>
        apiError(c, 403, message || 'You do not have permission to perform this action'),

    notFound: (c: AppContext, resource?: string) =>
        apiError(c, 404, resource ? `${resource} not found` : 'Resource not found'),

    conflict: (c: AppContext, message?: string) =>
        apiError(c, 409, message || 'Resource already exists'),

    validation: (c: AppContext, message: string) =>
        apiError(c, 422, message),

    rateLimit: (c: AppContext, message?: string) =>
        apiError(c, 429, message || 'Too many requests. Please try again later.'),

    internal: (c: AppContext, error?: unknown) => {
        if (error) {
            console.error('Internal server error:', error);
        }
        return apiError(c, 500, 'An unexpected error occurred. Please try again later.');
    },

    serviceUnavailable: (c: AppContext, message?: string) =>
        apiError(c, 503, message || 'Service temporarily unavailable'),
};

export function withErrorHandling<T extends AppContext>(
    handler: (c: T) => Promise<Response>
) {
    return async (c: T): Promise<Response> => {
        try {
            return await handler(c);
        } catch (error) {
            return errors.internal(c as AppContext, error);
        }
    };
}
