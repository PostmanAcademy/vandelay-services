/**
 * Vandelay Industries API server.
 *
 * Serves the five Vandelay APIs from one container, each under the path of its spec's server URL:
 *   /customers/v1  /policies/v1  /claims/v1  /payments/v1  /vendors/v1
 * Data lives in Postgres and is seeded on first start.
 */
process.env.TZ = 'UTC';

import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { pool, waitForDb, migrate, ensureDatabase } from './db';
import { ApiError, problemResponse, rateLimit, requireAuth, configuredPersonas, PERSONA_ENV_NAMES, notFound } from './lib/http';
import { basePath, specText, SPEC_FILES, spec, type ApiName } from './lib/openapi';
import { ensureSeeded, reset, SEED_VERSION } from './seed/index';
import { settleDue } from './lib/domain';
import { customersApi } from './apis/customers';
import { policiesApi } from './apis/policies';
import { claimsApi } from './apis/claims';
import { paymentsApi } from './apis/payments';
import { vendorsApi } from './apis/vendors';

const APP_ENV = process.env.APP_ENV ?? 'development';
const PORT = parseInt(process.env.PORT ?? '8080', 10);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN?.trim();

const APIS: Record<ApiName, Hono> = {
  customers: customersApi,
  policies: policiesApi,
  claims: claimsApi,
  payments: paymentsApi,
  vendors: vendorsApi,
};

const app = new Hono();

app.onError((err, c) => {
  if (err instanceof ApiError) return problemResponse(err);
  console.error(`[error] ${c.req.method} ${c.req.path}`, err);
  return problemResponse(new ApiError(500, 'internal-error', 'Internal server error', 'An unexpected error occurred. Please retry or contact the API platform team.'));
});
app.notFound((c) => problemResponse(notFound(`No route matches ${c.req.method} ${c.req.path}.`, 'Route not found')));

app.use('*', async (c, next) => {
  const start = performance.now();
  await next();
  if (c.req.path !== '/health') console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${Math.round(performance.now() - start)}ms`);
});

// ---- Public, unauthenticated endpoints ----------------------------------------------------------

app.get('/health', async (c) => {
  try {
    await pool.query('SELECT 1');
    return c.json({ status: 'ok', environment: APP_ENV, database: 'up' });
  } catch {
    return c.json({ status: 'degraded', environment: APP_ENV, database: 'down' }, 503);
  }
});

app.get('/', (c) =>
  c.json({
    name: 'Vandelay Industries APIs',
    environment: APP_ENV,
    seedVersion: SEED_VERSION,
    apis: (Object.keys(APIS) as ApiName[]).map((api) => ({
      name: spec(api).info.title,
      version: spec(api).info.version,
      basePath: basePath(api),
      openapi: `${basePath(api)}/openapi.yaml`,
    })),
    auth: 'Authorization: Bearer <token>',
  }),
);

/** Admin: wipe and re-seed the database (for resetting a lab). Disabled unless ADMIN_TOKEN is set. */
app.post('/_admin/reset', async (c) => {
  const supplied = c.req.header('X-Admin-Token') ?? '';
  const ok = !!ADMIN_TOKEN && supplied.length === ADMIN_TOKEN.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(ADMIN_TOKEN));
  if (!ok) throw notFound(`No route matches POST /_admin/reset.`, 'Route not found');
  const counts = await reset();
  return c.json({ status: 'reset', seedVersion: SEED_VERSION, counts });
});

// ---- The APIs -----------------------------------------------------------------------------------

for (const [api, router] of Object.entries(APIS) as [ApiName, Hono][]) {
  const base = basePath(api);
  app.get(`${base}/openapi.yaml`, (c) => c.body(specText(api), 200, { 'Content-Type': 'application/yaml' }));
  app.use(`${base}/*`, requireAuth, rateLimit);
  app.route(base, router);
}

// ---- Startup ------------------------------------------------------------------------------------

if (!configuredPersonas.length) {
  console.error(`[auth] No API tokens configured. Set at least one of: ${PERSONA_ENV_NAMES.join(', ')} (as platform secrets). Refusing to start.`);
  process.exit(1);
}
console.log(`[auth] ${configuredPersonas.length} API token(s) configured: ${configuredPersonas.join(', ')}`);

await ensureDatabase();
await waitForDb();
await migrate();
await ensureSeeded();
setInterval(() => settleDue().catch((e) => console.error('[settlement]', e)), 5000);

console.log(`[server] Vandelay APIs (${APP_ENV}) listening on :${PORT} — specs: ${Object.values(SPEC_FILES).join(', ')}`);

export default { port: PORT, fetch: app.fetch };
