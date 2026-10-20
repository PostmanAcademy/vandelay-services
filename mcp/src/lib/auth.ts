/**
 * Caller identity. The MCP server never invents credentials: a caller presents one of the four Vandelay
 * persona bearer tokens (the same ones the APIs accept), the server recognises it by comparing against the
 * `API_TOKEN_*` environment variables, and forwards that same token to the APIs. The APIs therefore still
 * enforce their own scopes (403 on payments for an agent, PII masking, customer-visible notes only), and the
 * MCP layer adds role-based tool visibility, ownership checks, and business rules on top.
 */
import { timingSafeEqual } from 'node:crypto';

export type Role = 'customer' | 'agent' | 'adjuster' | 'supervisor';

export interface Principal {
  token: string;
  /** Actor ID the APIs record (customer ID, adjuster ID, or agent ID). */
  sub: string;
  name: string;
  role: Role;
  scopes: string[];
  /** Set for customers: the only customer whose data they may see. */
  customerId?: string;
}

const PERSONAS: Record<string, Omit<Principal, 'token'>> = {
  API_TOKEN_AGENT: { sub: 'agt_claims_assistant', name: 'Vandelay Claims Assistant (AI agent)', role: 'agent', scopes: [] },
  API_TOKEN_ADJUSTER: { sub: 'adj_220', name: 'Priya Raman (Claims Adjuster)', role: 'adjuster', scopes: ['customers:pii:read', 'payments:write'] },
  API_TOKEN_SUPERVISOR: {
    sub: 'adj_105',
    name: 'Denise Okafor (Claims Supervisor)',
    role: 'supervisor',
    scopes: ['customers:pii:read', 'customers:delete', 'payments:write', 'payments:approve'],
  },
  API_TOKEN_CUSTOMER: { sub: 'cus_01HX9K', name: 'Marisol Vega (Customer)', role: 'customer', scopes: [], customerId: 'cus_01HX9K' },
};

const MIN_TOKEN_LENGTH = 24;

function loadTokens(): [string, Omit<Principal, 'token'>][] {
  const out: [string, Omit<Principal, 'token'>][] = [];
  for (const [env, persona] of Object.entries(PERSONAS)) {
    const token = process.env[env]?.trim();
    if (!token) continue;
    if (token.length < MIN_TOKEN_LENGTH) throw new Error(`${env} must be at least ${MIN_TOKEN_LENGTH} characters.`);
    out.push([token, persona]);
  }
  return out;
}

const tokens = loadTokens();
export const configuredPersonas = Object.entries(PERSONAS).filter(([env]) => process.env[env]?.trim()).map(([env]) => env);
export const PERSONA_ENV_NAMES = Object.keys(PERSONAS);

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Resolves an `Authorization` header to a principal, or undefined. Checks every token so timing does not leak which matched. */
export function authenticate(header: string | null | undefined): Principal | undefined {
  const m = /^Bearer\s+(.+)$/i.exec(header ?? '');
  if (!m) return undefined;
  const presented = m[1].trim();
  let found: Principal | undefined;
  for (const [token, persona] of tokens) if (same(token, presented)) found = { ...persona, token };
  return found;
}

export const isStaff = (p: Principal) => p.role === 'adjuster' || p.role === 'supervisor';
/** Customers and agents only ever see the customer-facing view of a claim. */
export const isCustomerAudience = (p: Principal) => !isStaff(p);
