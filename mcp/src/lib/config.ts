/** Runtime configuration. Everything comes from environment variables; nothing secret is stored in the repo. */
export const PORT = parseInt(process.env.PORT ?? '8090', 10);
export const APP_ENV = process.env.APP_ENV ?? 'development';

/** Host-only base URL of the Vandelay APIs (the same host serves /claims/v1, /payments/v1, ...). */
export const API_BASE_URL = (process.env.VANDELAY_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

/**
 * MCP-layer business policy (not part of the API contract): the largest approved amount an adjuster may
 * approve alone. Above it the claim must be approved by a supervisor.
 */
export const ADJUSTER_APPROVAL_LIMIT = Number(process.env.ADJUSTER_APPROVAL_LIMIT ?? 15_000);

/** Mirrors the Payments API: amounts above these wait in `pending_approval` for a second person. */
export const PAYMENT_APPROVAL_THRESHOLD = { customer: 10_000, vendor: 25_000 } as const;

/** A claim reported more than this many days after the loss is flagged for review. */
export const LATE_REPORT_DAYS = 30;
