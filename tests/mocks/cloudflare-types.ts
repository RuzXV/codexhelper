// Minimal type stubs so test files can import from functions/api/* without
// pulling in the full @cloudflare/workers-types package at test time.

export interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    meta?: Record<string, unknown>;
}

export interface D1ExecResult {
    count: number;
    duration: number;
}

export interface KVNamespace {
    get(key: string, options?: unknown): Promise<string | null>;
    put(key: string, value: string, options?: unknown): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: unknown): Promise<{ keys: { name: string; expiration?: number; metadata?: unknown }[] }>;
}
