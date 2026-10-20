import type { Context, MiddlewareHandler } from 'hono';
import { createHash, randomBytes } from 'node:crypto';
import { formatAjvErrors, requestBodyValidator, type ApiName } from './openapi';
import { one, query, type Db } from '../db';

const PROBLEM_BASE = 'https://api.vandelay-industries.example/problems/';

export type FieldError = { field: string; message: string };

/** An RFC 7807 problem. Throw from a handler; the app's error handler renders it. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public slug: string,
    public title: string,
    public detail?: string,
    public errors?: FieldError[],
    public headers?: Record<string, string>,
  ) {
    super(detail ?? title);
  }
}

export const badRequest = (detail: string, errors?: FieldError[]) =>
  new ApiError(400, 'validation-error', 'Validation failed', detail, errors);
export const notFound = (detail = 'No resource exists with the given ID.', title = 'Resource not found') =>
  new ApiError(404, 'not-found', title, detail);
export const forbidden = (detail = 'Token is missing the required scope.') => new ApiError(403, 'forbidden', 'Forbidden', detail);
export const conflict = (detail: string, title = 'Conflict', slug = 'conflict') => new ApiError(409, slug, title, detail);
export const unprocessable = (slug: string, title: string, detail: string) => new ApiError(422, slug, title, detail);

export const traceId = () => randomBytes(16).toString('hex');

export function problemBody(err: ApiError) {
  return {
    type: PROBLEM_BASE + err.slug,
    title: err.title,
    status: err.status,
    ...(err.detail ? { detail: err.detail } : {}),
    ...(err.errors?.length ? { errors: err.errors } : {}),
    traceId: traceId(),
  };
}

export function problemResponse(err: ApiError): Response {
  return new Response(JSON.stringify(problemBody(err)), {
    status: err.status,
    headers: { 'Content-Type': 'application/problem+json', ...(err.headers ?? {}) },
  });
}

// ---- Formatting helpers -------------------------------------------------------------------------

/** ISO-8601 UTC timestamp without milliseconds, matching the spec examples (2026-10-02T18:21:07Z). */
export function iso(d: Date | string | null | undefined): string | undefined {
  if (d === null || d === undefined) return undefined;
  return new Date(d).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function money(amount: number | null | undefined, currency = 'USD') {
  if (amount === null || amount === undefined) return undefined;
  return { amount: Number(amount), currency: currency.trim() };
}

/** Drops undefined properties (null is kept for fields the spec marks nullable). */
export function compact<T extends Record<string, unknown>>(obj: T): T {
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  return obj;
}

export const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---- Request parsing ----------------------------------------------------------------------------

export async function readJson(c: Context, required = true): Promise<any> {
  const text = await c.req.text();
  if (!text.trim()) {
    if (required) throw badRequest('Request body is required.', [{ field: 'body', message: 'is required' }]);
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw badRequest('Request body is not valid JSON.', [{ field: 'body', message: 'must be valid JSON' }]);
  }
}

/** Parses and validates a JSON body against the operation's request schema in the spec. */
export async function validBody<T = any>(c: Context, api: ApiName, operationId: string, required = true): Promise<T> {
  const body = await readJson(c, required);
  if (body === undefined) return {} as T;
  const validate = requestBodyValidator(api, operationId);
  if (!validate(body)) throw badRequest('Request body failed validation.', formatAjvErrors(validate.errors));
  return body as T;
}

// ---- Pagination ---------------------------------------------------------------------------------

export interface Page {
  limit: number;
  offset: number;
}

/**
 * Parses `limit` and `cursor`. Operations that document a 400 response reject bad values;
 * operations that don't fall back to the defaults so they only return documented status codes.
 */
export function parsePage(c: Context, strict: boolean): Page {
  const rawLimit = c.req.query('limit');
  const rawCursor = c.req.query('cursor');
  let limit = 20;
  if (rawLimit !== undefined) {
    const n = Number(rawLimit);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      if (strict) throw badRequest('Invalid query parameter.', [{ field: 'limit', message: 'must be an integer between 1 and 100' }]);
      limit = Number.isInteger(n) ? Math.min(Math.max(n, 1), 100) : 20;
    } else limit = n;
  }
  let offset = 0;
  if (rawCursor) {
    try {
      const o = JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8')).o;
      if (!Number.isInteger(o) || o < 0) throw new Error();
      offset = o;
    } catch {
      if (strict) throw badRequest('Invalid query parameter.', [{ field: 'cursor', message: 'is not a valid cursor' }]);
    }
  }
  return { limit, offset };
}

export const encodeCursor = (offset: number) => Buffer.from(JSON.stringify({ o: offset })).toString('base64url');

/** Fetch limit+1 rows, then call this to build `{ data, nextCursor }`. */
export function pageOf<T>(rows: T[], page: Page) {
  const hasMore = rows.length > page.limit;
  return { data: rows.slice(0, page.limit), nextCursor: hasMore ? encodeCursor(page.offset + page.limit) : null };
}

// ---- Auth ---------------------------------------------------------------------------------------

export const SCOPES = {
  PII_READ: 'customers:pii:read',
  CUSTOMER_DELETE: 'customers:delete',
  PAYMENTS_WRITE: 'payments:write',
  PAYMENTS_APPROVE: 'payments:approve',
} as const;

export interface Principal {
  token: string;
  sub: string;
  name: string;
  actorType: 'customer' | 'adjuster' | 'vendor' | 'system';
  scopes: string[];
}

/**
 * The personas that can call the APIs. Their names and scopes are not secret; the bearer token for
 * each comes ONLY from the environment variable named here (a platform secret in deployments), so no
 * credential is ever stored in the code, the repo, or the image.
 */
const PERSONAS: Record<string, Omit<Principal, 'token'>> = {
  API_TOKEN_AGENT: { sub: 'agt_claims_assistant', name: 'Vandelay Claims Assistant (AI agent)', actorType: 'system', scopes: [] },
  API_TOKEN_ADJUSTER: { sub: 'adj_220', name: 'Priya Raman (Claims Adjuster)', actorType: 'adjuster', scopes: [SCOPES.PII_READ, SCOPES.PAYMENTS_WRITE] },
  API_TOKEN_SUPERVISOR: {
    sub: 'adj_105',
    name: 'Denise Okafor (Claims Supervisor)',
    actorType: 'adjuster',
    scopes: [SCOPES.PII_READ, SCOPES.CUSTOMER_DELETE, SCOPES.PAYMENTS_WRITE, SCOPES.PAYMENTS_APPROVE],
  },
  API_TOKEN_CUSTOMER: { sub: 'cus_01HX9K', name: 'Marisol Vega (Customer)', actorType: 'customer', scopes: [] },
};

const MIN_TOKEN_LENGTH = 24;

function loadTokens(): Map<string, Omit<Principal, 'token'>> {
  const tokens = new Map<string, Omit<Principal, 'token'>>();
  for (const [envName, persona] of Object.entries(PERSONAS)) {
    const token = process.env[envName]?.trim();
    if (!token) continue;
    if (token.length < MIN_TOKEN_LENGTH) throw new Error(`${envName} must be at least ${MIN_TOKEN_LENGTH} characters.`);
    if (tokens.has(token)) throw new Error(`${envName} duplicates another API token; each persona needs its own.`);
    tokens.set(token, persona);
  }
  return tokens;
}

const tokens = loadTokens();
/** Names of the persona variables that are set (never their values). */
export const configuredPersonas = Object.entries(PERSONAS).filter(([env]) => process.env[env]?.trim()).map(([env]) => env);
export const PERSONA_ENV_NAMES = Object.keys(PERSONAS);

const unauthorized = () => new ApiError(401, 'unauthorized', 'Unauthorized', 'Bearer token is missing, expired, or invalid.', undefined, { 'WWW-Authenticate': 'Bearer' });

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const p = match ? tokens.get(match[1].trim()) : undefined;
  if (!p) throw unauthorized();
  c.set('principal', { ...p, token: match![1].trim() } satisfies Principal);
  await next();
};

export const principal = (c: Context): Principal => c.get('principal');
export const hasScope = (c: Context, scope: string) => principal(c).scopes.includes(scope);
export function requireScope(c: Context, scope: string) {
  if (!hasScope(c, scope)) throw forbidden(`Token is missing the required scope \`${scope}\`.`);
}

// ---- Rate limiting ------------------------------------------------------------------------------

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE ?? '600', 10);
const windows = new Map<string, { start: number; count: number }>();

/** Per-token fixed window. Mount after `requireAuth` so only valid tokens ever create entries. */
export const rateLimit: MiddlewareHandler = async (c, next) => {
  const key = principal(c).token;
  const now = Date.now();
  let w = windows.get(key);
  if (!w || now - w.start >= 60_000) {
    w = { start: now, count: 0 };
    windows.set(key, w);
  }
  w.count++;
  c.header('X-RateLimit-Limit', String(RATE_LIMIT));
  c.header('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT - w.count)));
  if (w.count > RATE_LIMIT) {
    const retry = Math.ceil((w.start + 60_000 - now) / 1000);
    throw new ApiError(429, 'rate-limited', 'Too many requests', `Rate limit of ${RATE_LIMIT} requests per minute exceeded.`, undefined, {
      'Retry-After': String(retry),
    });
  }
  await next();
};

// ---- Idempotency --------------------------------------------------------------------------------

export interface StoredResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

/**
 * Runs a create handler with `Idempotency-Key` semantics: a retry with the same key and body
 * replays the original response; the same key with a different body is rejected with
 * `mismatchStatus` (409 where the operation documents it).
 */
export async function idempotent(
  c: Context,
  opts: { scope: string; required: boolean; body: unknown; mismatchStatus?: 400 | 409 | 422 },
  handler: () => Promise<StoredResponse>,
): Promise<Response> {
  const key = c.req.header('Idempotency-Key')?.trim();
  if (!key) {
    if (opts.required) throw badRequest('The Idempotency-Key header is required for this operation.', [{ field: 'Idempotency-Key', message: 'is required' }]);
    return send(await handler());
  }
  const scope = `${opts.scope}:${principal(c).sub}`;
  const hash = createHash('sha256').update(JSON.stringify(opts.body ?? null)).digest('hex');
  const prior = await one(`SELECT request_hash, status_code, headers, body FROM idempotency_keys WHERE scope = $1 AND key = $2`, [scope, key]);
  if (prior) {
    if (prior.request_hash !== hash) {
      const detail = `Idempotency-Key ${key} was already used with a different request body.`;
      const status = opts.mismatchStatus ?? 409;
      if (status === 409) throw conflict(detail, 'Idempotency key reused', 'idempotency-key-reused');
      if (status === 422) throw unprocessable('idempotency-key-reused', 'Idempotency key reused', detail);
      throw badRequest(detail, [{ field: 'Idempotency-Key', message: 'was already used with a different request body' }]);
    }
    return send({ status: prior.status_code, body: prior.body, headers: { ...prior.headers, 'Idempotent-Replayed': 'true' } });
  }
  const result = await handler();
  if (result.status < 300) {
    await query(
      `INSERT INTO idempotency_keys (scope, key, request_hash, status_code, headers, body) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [scope, key, hash, result.status, JSON.stringify(result.headers ?? {}), JSON.stringify(result.body)],
    );
  }
  return send(result);
}

export function send(r: StoredResponse): Response {
  return new Response(r.body === undefined ? null : JSON.stringify(r.body), {
    status: r.status,
    headers: { ...(r.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(r.headers ?? {}) },
  });
}

// ---- Claim timeline -----------------------------------------------------------------------------

export async function recordEvent(
  db: Db,
  claimId: string,
  event: string,
  summary: string,
  actor?: { type: string; id: string } | Principal,
  at: Date = new Date(),
) {
  const a = actor && 'actorType' in actor ? { type: actor.actorType, id: actor.sub } : actor;
  await query(`INSERT INTO claim_events (claim_id, at, event, actor_type, actor_id, summary) VALUES ($1, $2, $3, $4, $5, $6)`, [
    claimId,
    at,
    event,
    a?.type ?? null,
    a?.id ?? null,
    summary,
  ], db);
}

export const fmtUsd = (n: number) => `${Number(n).toFixed(2)} USD`;

declare module 'hono' {
  interface ContextVariableMap {
    principal: Principal;
  }
}
