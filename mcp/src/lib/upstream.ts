/** Thin client for the Vandelay APIs. Always calls as the caller (their token), never with a service credential. */
import { API_BASE_URL } from './config';
import type { Principal } from './auth';

export interface Problem {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  errors?: { field?: string; message?: string }[];
  traceId?: string;
}

export class ApiProblem extends Error {
  constructor(public status: number, public problem: Problem, public method: string, public path: string) {
    super(problem.detail ?? problem.title ?? `HTTP ${status}`);
  }
}

interface CallOpts {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  idempotencyKey?: string;
}

export async function api<T = any>(p: Principal, method: string, path: string, opts: CallOpts = {}): Promise<T> {
  const url = new URL(API_BASE_URL + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { Authorization: `Bearer ${p.token}`, Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  const res = await fetch(url, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  if (!res.ok) {
    const problem: Problem = json && typeof json === 'object' ? { status: res.status, ...json } : { status: res.status, title: res.statusText, detail: text.slice(0, 300) };
    throw new ApiProblem(res.status, problem, method, path);
  }
  return json as T;
}

export const get = <T = any>(p: Principal, path: string, query?: CallOpts['query']) => api<T>(p, 'GET', path, { query });

/** Follows `nextCursor` up to `maxPages` pages and returns the concatenated `data`. */
export async function getAll<T = any>(p: Principal, path: string, query: CallOpts['query'] = {}, maxPages = 5): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const page = await get<{ data: T[]; nextCursor?: string | null }>(p, path, { limit: 100, ...query, cursor });
    out.push(...page.data);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}

/** Like `get` but returns undefined on 404 / 403 instead of throwing (for optional enrichment). */
export async function tryGet<T = any>(p: Principal, path: string, query?: CallOpts['query']): Promise<T | undefined> {
  try {
    return await get<T>(p, path, query);
  } catch (e) {
    if (e instanceof ApiProblem && [403, 404].includes(e.status)) return undefined;
    throw e;
  }
}
