/**
 * Checks that the examples in the OpenAPI specs (SPEC_DIR) agree with the seeded data and the live API.
 *
 *   API_TOKEN_*=... ADMIN_TOKEN=... bun test tests/examples.test.ts     (SPEC_DIR=<dir> to check another copy of the specs)
 *
 * 1. Every request/response example validates against its schema (responses in strict mode).
 * 2. Every ID an example mentions exists in the live API (except IDs created by a 201 example).
 * 3. Every address, ZIP code, license/plate state and UTC offset is in Vandelay's Southeast markets.
 * 4. Stable GET examples are a subset of the live response for the documented request.
 *
 * Lifecycle snapshots (for example the claim as it looked when first submitted) are intentionally not
 * compared with live state; they are listed in SNAPSHOTS below.
 */
import { describe, test, expect, beforeAll } from 'bun:test';
import { call, expectStatus, resetData, ADMIN_TOKEN, TOKENS } from './helpers';
import { spec, operations, requestBodyValidator, responseValidator, responseFor, formatAjvErrors, type ApiName } from '../src/lib/openapi';
import { ZIPS, METRO_INFO, ADJUSTERS } from '../src/seed/reference';

const APIS: ApiName[] = ['customers', 'policies', 'claims', 'payments', 'vendors'];
const MARISOL = 'cus_01HX9K';
const CLAIM = 'clm_2026-000417';

/**
 * IDs that appear in examples but are intentionally not in the seed: the payment the `cancelPayment` example
 * shows being cancelled as a duplicate (a payment that only exists once someone makes the mistake).
 */
const NOT_SEEDED = new Set(['pay_90313']);

/** Examples that deliberately show a record at one moment of its life, not its current state. */
const SNAPSHOTS = new Set([
  'claims.createClaim.201', 'claims.getClaim.200', 'claims.updateClaim.200', 'claims.cancelClaim.200',
  'claims.assignVendorToClaim.201', 'payments.createPayment.201', 'payments.approvePayment.200', 'payments.cancelPayment.200',
  'payments.createPaymentRefund.201', 'customers.updateCustomer.200', 'vendors.updateVendor.200', 'vendors.updateWorkOrder.200',
]);

interface Example { api: ApiName; opId: string; kind: 'request' | 'response'; status?: number; name: string; value: any }

function collectExamples(): Example[] {
  const out: Example[] = [];
  for (const api of APIS) {
    for (const o of operations(api)) {
      for (const [name, ex] of Object.entries<any>(o.op.requestBody?.content?.['application/json']?.examples ?? {})) {
        out.push({ api, opId: o.operationId, kind: 'request', name, value: ex.value });
      }
      for (const code of Object.keys(o.op.responses)) {
        const r = responseFor(api, o.operationId, code);
        for (const [ct, media] of Object.entries<any>(r?.content ?? {})) {
          for (const [name, ex] of Object.entries<any>(media.examples ?? {})) {
            out.push({ api, opId: o.operationId, kind: 'response', status: Number(code), name, value: ex.value });
          }
          void ct;
        }
      }
    }
  }
  return out;
}

function walk(value: any, path: string, fn: (v: any, path: string, parent?: any) => void, parent?: any) {
  fn(value, path, parent);
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, fn, value));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, fn, value);
}

const examples = collectExamples();
const label = (e: Example) => `${e.api}.${e.opId} ${e.kind}${e.status ? ' ' + e.status : ''} "${e.name}"`;

beforeAll(async () => {
  if (ADMIN_TOKEN && process.env.SKIP_RESET !== '1') await resetData();
}, 60_000);

describe('examples validate against their schemas', () => {
  test('there are examples to check', () => expect(examples.length).toBeGreaterThan(100));

  test('every request example matches its request schema', () => {
    const bad: unknown[] = [];
    for (const e of examples.filter((x) => x.kind === 'request')) {
      const validate = requestBodyValidator(e.api, e.opId);
      if (!validate(e.value)) bad.push({ example: label(e), errors: formatAjvErrors(validate.errors) });
    }
    expect(bad).toEqual([]);
  });

  test('every response example matches its response schema (strict)', () => {
    const bad: unknown[] = [];
    for (const e of examples.filter((x) => x.kind === 'response')) {
      const ct = e.status! >= 400 ? 'application/problem+json' : 'application/json';
      const validate = responseValidator(e.api, e.opId, e.status!, ct);
      if (validate && !validate(e.value)) bad.push({ example: label(e), errors: validate.errors?.slice(0, 3).map((x) => `${x.instancePath} ${x.message}`) });
    }
    expect(bad).toEqual([]);
  });
});

describe('examples are consistent with the Southeast data set', () => {
  const zips = new Set(ZIPS.map((z) => z.zip));
  const cityState = new Set(Object.values(METRO_INFO).map((m) => `${m.city}|${m.state}`));
  const states = new Set(Object.values(METRO_INFO).map((m) => m.state));
  const allowedOffsets = new Set(['Z', '-04:00', '-05:00']);

  test('addresses, ZIP codes, plate/license states, and time zones', () => {
    const bad: string[] = [];
    const check = (v: any, path: string, where: string) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (typeof v.city === 'string' && typeof v.state === 'string' && !cityState.has(`${v.city}|${v.state}`)) bad.push(`${where} ${path}: ${v.city}, ${v.state}`);
        if (typeof v.postalCode === 'string' && !zips.has(v.postalCode)) bad.push(`${where} ${path}.postalCode ${v.postalCode}`);
        for (const k of ['licenseState', 'licensePlateState']) if (typeof v[k] === 'string' && !states.has(v[k])) bad.push(`${where} ${path}.${k} ${v[k]}`);
        if (Array.isArray(v.serviceAreaPostalCodes)) for (const z of v.serviceAreaPostalCodes) if (!zips.has(z)) bad.push(`${where} ${path}.serviceAreaPostalCodes ${z}`);
      }
      if (typeof v === 'string') {
        const m = /T\d\d:\d\d:\d\d(?:\.\d+)?(Z|[+-]\d\d:\d\d)$/.exec(v);
        if (m && !allowedOffsets.has(m[1])) bad.push(`${where} ${path}: ${v}`);
      }
    };
    for (const e of examples) walk(e.value, '', (v, p) => check(v, p, label(e)));
    for (const api of APIS) {
      for (const o of operations(api)) {
        for (const p of [...(o.pathItem.parameters ?? []), ...(o.op.parameters ?? [])]) {
          if (p.name === 'postalCode' && p.example && !zips.has(p.example)) bad.push(`${api}.${o.operationId} parameter postalCode ${p.example}`);
        }
      }
      const addr = spec(api).components.schemas.Address?.properties;
      if (addr && !cityState.has(`${addr.city.example}|${addr.state.example}`)) bad.push(`${api} Address schema example ${addr.city.example}, ${addr.state.example}`);
    }
    expect(bad).toEqual([]);
  });

  test('every ID an example mentions exists in the live API', async () => {
    const created = new Set<string>();
    const mentioned = new Map<string, string>();
    for (const e of examples) {
      const isError = e.kind === 'response' && e.status! >= 400;
      walk(e.value, '', (v) => {
        if (typeof v !== 'string') return;
        for (const id of v.match(/\b(?:cus|veh|pol|drv|clm|ven|wo|pay|pm|ref|asg|adj|note)_[A-Za-z0-9-]+\b/g) ?? []) {
          if (e.kind === 'response' && e.status === 201) created.add(id);
          if (!isError) mentioned.set(id, label(e));
        }
      });
    }
    const adj = new Set(ADJUSTERS.map((a) => a.id));
    const marisolVehicles = expectStatus(await call('customers', 'listCustomerVehicles', { params: { customerId: MARISOL } }), 200).data.map((v: any) => v.id);
    const marisolDrivers = expectStatus(await call('policies', 'listPolicyDrivers', { params: { policyId: 'pol_AUT-882145' } }), 200).data.map((d: any) => d.id);
    const methods = new Set<string>();
    for (const payee of [MARISOL, 'ven_4417']) for (const m of expectStatus(await call('payments', 'listPaymentMethods', { query: { payeeId: payee } }), 200).data) methods.add(m.id);
    const assignments = new Set(expectStatus(await call('claims', 'listClaimAssignments', { params: { claimId: CLAIM } }), 200).data.map((a: any) => a.id));
    const refunds = new Set(expectStatus(await call('payments', 'listPaymentRefunds', { params: { paymentId: 'pay_90311' } }), 200).data.map((r: any) => r.id));

    const missing: string[] = [];
    for (const [id, where] of mentioned) {
      if (created.has(id) || NOT_SEEDED.has(id)) continue;
      const prefix = id.split('_')[0];
      let found: boolean;
      switch (prefix) {
        case 'cus': found = (await call('customers', 'getCustomer', { params: { customerId: id } })).status === 200; break;
        case 'pol': found = (await call('policies', 'getPolicy', { params: { policyId: id } })).status === 200; break;
        case 'clm': found = (await call('claims', 'getClaim', { params: { claimId: id } })).status === 200; break;
        case 'ven': found = (await call('vendors', 'getVendor', { params: { vendorId: id } })).status === 200; break;
        case 'wo': found = (await call('vendors', 'getWorkOrder', { params: { workOrderId: id } })).status === 200; break;
        case 'pay': found = (await call('payments', 'getPayment', { params: { paymentId: id } })).status === 200; break;
        case 'veh': found = marisolVehicles.includes(id); break;
        case 'drv': found = marisolDrivers.includes(id); break;
        case 'pm': found = methods.has(id); break;
        case 'asg': found = assignments.has(id); break;
        case 'ref': found = refunds.has(id); break;
        case 'adj': found = adj.has(id); break;
        default: found = true; // note_* ids are created by examples; their numbering depends on the claim
      }
      if (!found) missing.push(`${id} (${where})`);
    }
    expect(missing).toEqual([]);
  }, 120_000);
});

/** True when every field in `example` equals the same field in `live` (live may have more fields). */
function subsetDiff(example: any, live: any, path = ''): string[] {
  if (example === null || typeof example !== 'object') {
    const same = typeof example === 'number' && typeof live === 'number' ? Math.abs(example - live) < 1e-9 : example === live;
    return same ? [] : [`${path || '/'}: example ${JSON.stringify(example)} but live ${JSON.stringify(live)}`];
  }
  if (Array.isArray(example)) {
    if (!Array.isArray(live)) return [`${path}: expected an array`];
    return example.flatMap((item, i) => {
      const keyed = item && typeof item === 'object' ? (item.id !== undefined ? ['id', item.id] : item.code !== undefined ? ['code', item.code] : null) : null;
      if (!keyed) {
        const found = live.some((l: any) => subsetDiff(item, l, `${path}[${i}]`).length === 0);
        return found ? [] : [`${path}[${i}]: no live item matches ${JSON.stringify(item).slice(0, 120)}`];
      }
      const match = live.find((l: any) => l?.[keyed[0]] === keyed[1]);
      return match === undefined ? [`${path}[${i}]: no live item with ${keyed[0]} ${keyed[1]}`] : subsetDiff(item, match, `${path}[${keyed[1]}]`);
    });
  }
  if (live === null || typeof live !== 'object') return [`${path}: expected an object`];
  return Object.entries(example).flatMap(([k, v]) => (k in live ? subsetDiff(v, live[k], `${path}.${k}`) : [`${path}.${k}: missing from live response`]));
}

const first = (api: ApiName, opId: string, status = 200) => {
  const o = operations(api).find((x) => x.operationId === opId)!;
  const media = responseFor(api, opId, status).content['application/json'];
  return Object.values<any>(media.examples)[0].value;
};

/** Stable GET examples and the request that reproduces each. */
const LIVE: { api: ApiName; opId: string; params?: Record<string, string>; query?: Record<string, string | number | boolean>; token?: () => string }[] = [
  { api: 'customers', opId: 'listCustomers', query: { email: 'marisol.vega@example.com' } },
  // The example shows the masked date of birth, which is what a caller without customers:pii:read (the agent) sees.
  { api: 'customers', opId: 'getCustomer', params: { customerId: MARISOL }, token: () => TOKENS.agent },
  { api: 'customers', opId: 'listCustomerVehicles', params: { customerId: MARISOL } },
  { api: 'customers', opId: 'getCustomerPreferences', params: { customerId: MARISOL } },
  { api: 'policies', opId: 'listPolicies', query: { customerId: MARISOL, status: 'active' } },
  { api: 'policies', opId: 'getPolicy', params: { policyId: 'pol_AUT-882145' } },
  { api: 'policies', opId: 'listPolicyCoverages', params: { policyId: 'pol_AUT-882145' } },
  { api: 'policies', opId: 'listPolicyVehicles', params: { policyId: 'pol_AUT-882145' } },
  { api: 'policies', opId: 'listPolicyDrivers', params: { policyId: 'pol_AUT-882145' } },
  { api: 'claims', opId: 'listClaims', query: { customerId: MARISOL, policyId: 'pol_AUT-882145', status: 'approved' } },
  { api: 'claims', opId: 'listClaimAssignments', params: { claimId: CLAIM } },
  { api: 'claims', opId: 'getClaimTimeline', params: { claimId: CLAIM } },
  { api: 'vendors', opId: 'listVendors', query: { type: 'repair', postalCode: '28203', radiusMiles: 25, inNetwork: true } },
  { api: 'vendors', opId: 'getVendor', params: { vendorId: 'ven_4417' } },
  { api: 'vendors', opId: 'listWorkOrders', query: { claimId: CLAIM, vendorId: 'ven_4417' } },
  { api: 'vendors', opId: 'getWorkOrder', params: { workOrderId: 'wo_9001' } },
  { api: 'payments', opId: 'listPayments', query: { claimId: CLAIM, payeeId: 'ven_4417' } },
  { api: 'payments', opId: 'getPayment', params: { paymentId: 'pay_90311' } },
  { api: 'payments', opId: 'listPaymentRefunds', params: { paymentId: 'pay_90311' } },
  { api: 'payments', opId: 'listPaymentMethods', query: { payeeId: MARISOL } },
];

describe('stable GET examples are what the live API returns', () => {
  for (const t of LIVE) {
    test(`${t.api}.${t.opId}`, async () => {
      const r = expectStatus(await call(t.api, t.opId, { params: t.params, query: t.query, token: t.token?.() }), 200);
      expect(subsetDiff(first(t.api, t.opId), r)).toEqual([]);
    });
  }

  test('every documented GET example is either compared above or a listed snapshot', () => {
    const compared = new Set(LIVE.map((t) => `${t.api}.${t.opId}`));
    const uncovered = examples
      .filter((e) => e.kind === 'response' && e.status === 200 && operations(e.api).find((o) => o.operationId === e.opId)!.method === 'get')
      .map((e) => `${e.api}.${e.opId}`)
      .filter((k) => !compared.has(k) && !SNAPSHOTS.has(`${k}.200`));
    // getClaim and listClaimNotes are lifecycle-dependent and checked by the contract suite instead.
    expect([...new Set(uncovered)].sort()).toEqual(['claims.getClaim', 'claims.listClaimNotes'].filter((k) => !SNAPSHOTS.has(`${k}.200`)).sort());
  });
});
