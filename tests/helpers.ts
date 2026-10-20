/**
 * Contract-checking HTTP client for the tests.
 *
 * Every call is checked against the OpenAPI spec for its operation:
 *   - the status code must be documented for the operation (401/429 are allowed everywhere),
 *   - the content type must match the documented response,
 *   - the body must validate against the documented schema in strict mode (no undeclared fields).
 */
import { expect } from 'bun:test';
import { operation, operations, responseFor, responseValidator, type ApiName } from '../src/lib/openapi';

export const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
export const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const need = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} to the bearer token for that persona (see README: Authentication).`);
  return v;
};
/** Bearer tokens come only from the environment; nothing is stored in the repo. */
export const TOKENS = {
  get agent() { return need('API_TOKEN_AGENT'); },
  get adjuster() { return need('API_TOKEN_ADJUSTER'); },
  get supervisor() { return need('API_TOKEN_SUPERVISOR'); },
  get customer() { return need('API_TOKEN_CUSTOMER'); },
};

export const exercised = new Map<string, Set<number>>();


export interface CallOptions {
  params?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  rawBody?: string;
  token?: string | null;
  headers?: Record<string, string>;
  noRetry?: boolean;
}

export interface CallResult {
  status: number;
  body: any;
  headers: Headers;
}

export async function call(api: ApiName, operationId: string, opts: CallOptions = {}): Promise<CallResult> {
  const op = operation(api, operationId);
  const path = op.path.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(opts.params?.[k] ?? `missing-${k}`));
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) qs.set(k, String(v));
  const url = `${BASE_URL}${path}${qs.size ? `?${qs}` : ''}`;
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  const token = opts.token === undefined ? TOKENS.adjuster : opts.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: string | undefined;
  if (opts.rawBody !== undefined) body = opts.rawBody;
  else if (opts.body !== undefined) body = JSON.stringify(opts.body);
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res = await fetch(url, { method: op.method.toUpperCase(), headers, body });
  // Honor rate limiting so long sweeps work against any environment.
  for (let i = 0; res.status === 429 && !opts.noRetry && i < 3; i++) {
    const wait = Math.min(65, Number(res.headers.get('retry-after') ?? '5'));
    await res.text();
    await new Promise((r) => setTimeout(r, wait * 1000));
    res = await fetch(url, { method: op.method.toUpperCase(), headers, body });
  }
  const text = await res.text();
  const contentType = res.headers.get('content-type')?.split(';')[0].trim() ?? '';
  let json: any;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  const key = `${api}.${operationId}`;
  if (!exercised.has(key)) exercised.set(key, new Set());
  exercised.get(key)!.add(res.status);

  const where = `${op.method.toUpperCase()} ${path} -> ${res.status}`;
  const documented = responseFor(api, operationId, res.status);
  if (!documented) {
    expect([401, 429], `${where}: status ${res.status} is not documented for ${operationId}. Body: ${text.slice(0, 300)}`).toContain(res.status);
  } else if (documented.content) {
    expect(Object.keys(documented.content), `${where}: unexpected content type`).toContain(contentType);
    const validate = responseValidator(api, operationId, res.status, contentType)!;
    const ok = validate(json);
    expect(ok ? null : { errors: validate.errors, body: json }, `${where}: response does not match the spec schema`).toBeNull();
  } else {
    expect(text, `${where}: expected an empty body`).toBe('');
  }
  return { status: res.status, body: json, headers: res.headers };
}

/** Asserts the expected status, printing the body on mismatch. */
export function expectStatus(r: CallResult, status: number) {
  expect(r.status, `expected ${status}, got ${r.status}: ${JSON.stringify(r.body)?.slice(0, 500)}`).toBe(status);
  return r.body;
}

export async function resetData() {
  if (!ADMIN_TOKEN) throw new Error('Set ADMIN_TOKEN (matching the server) so the suite can reset the database to the seed baseline.');
  const res = await fetch(`${BASE_URL}/_admin/reset`, { method: 'POST', headers: { 'X-Admin-Token': ADMIN_TOKEN } });
  if (res.status !== 200) throw new Error(`Reset failed: ${res.status} ${await res.text()}`);
}

export async function listAll(api: ApiName, operationId: string, query: Record<string, string> = {}, token?: string) {
  const out: any[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 100; i++) {
    const r = await call(api, operationId, { query: { ...query, limit: 100, cursor }, token });
    expectStatus(r, 200);
    out.push(...r.body.data);
    cursor = r.body.nextCursor ?? undefined;
    if (!cursor) break;
  }
  return out;
}

export async function waitFor<T>(fn: () => Promise<T | undefined>, timeoutMs = 90_000, intervalMs = 1000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const v = await fn();
    if (v !== undefined) return v;
    if (Date.now() > deadline) throw new Error('Timed out waiting for condition');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export const allOperations = () => (['customers', 'policies', 'claims', 'payments', 'vendors'] as ApiName[]).flatMap((a) => operations(a).map((o) => `${a}.${o.operationId}`));

export const uid = () => Math.random().toString(36).slice(2, 8);
