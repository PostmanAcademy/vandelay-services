/**
 * Endpoint + business-flow tests. Every request goes through `call`, which validates the response
 * status, content type, and body against the OpenAPI spec. Tests run in order and build on each
 * other the way a real claim flows through the five APIs.
 *
 * Run against a server whose ADMIN_TOKEN matches; the suite resets data to the seed baseline first.
 * A small PAYMENT_SETTLEMENT_SECONDS on the server (e.g. 3) keeps the payment tests fast.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { call, expectStatus, resetData, TOKENS, exercised, allOperations, uid, waitFor, BASE_URL, listAll } from './helpers';
import { spec } from '../src/lib/openapi';

const ex = (api: any, opId: string, name: string, kind: 'request' | 'response' = 'request', status = '200') => {
  for (const item of Object.values<any>(spec(api).paths)) {
    for (const op of Object.values<any>(item)) {
      if (op?.operationId !== opId) continue;
      if (kind === 'request') return structuredClone(op.requestBody.content['application/json'].examples[name].value);
      return structuredClone(op.responses[status].content['application/json'].examples[name].value);
    }
  }
  throw new Error(`example ${opId}.${name} not found`);
};

const MARISOL = 'cus_01HX9K';
// Vandelay operates in the US Southeast, so records the spec examples describe in San Francisco are
// seeded in Charlotte, NC. IDs, names, and amounts match the examples; location details do not.
const CHARLOTTE = { addressLine1: '129 W Trade St', addressLine2: 'Apt 5A', city: 'Charlotte', state: 'NC', postalCode: '28202', country: 'US' };
const withoutLocation = ({ address, lossLocation, description, policeReportNumber, phone, serviceAreaPostalCodes, scheduledFor, ...rest }: any) => rest;
const POLICY = 'pol_AUT-882145';
const CLAIM = 'clm_2026-000417';
const state: Record<string, any> = {};

beforeAll(async () => {
  await resetData();
}, 60_000);

describe('platform', () => {
  test('health and service index are public', async () => {
    const h = await fetch(`${BASE_URL}/health`);
    expect(h.status).toBe(200);
    expect((await h.json()).database).toBe('up');
    const idx = await (await fetch(`${BASE_URL}/`)).json();
    expect(idx.apis.map((a: any) => a.basePath)).toEqual(['/customers/v1', '/policies/v1', '/claims/v1', '/payments/v1', '/vendors/v1']);
  });

  test('each spec is served next to its API', async () => {
    const r = await fetch(`${BASE_URL}/claims/v1/openapi.yaml`);
    expect(r.status).toBe(200);
    expect(await r.text()).toContain('title: Vandelay Claims API');
  });

  test('missing or invalid bearer tokens get 401 problems on every API', async () => {
    for (const [api, op, params] of [
      ['customers', 'getCustomer', { customerId: MARISOL }], ['policies', 'getPolicy', { policyId: POLICY }], ['claims', 'getClaim', { claimId: CLAIM }],
      ['payments', 'getPayment', { paymentId: 'pay_90311' }], ['vendors', 'getVendor', { vendorId: 'ven_4417' }],
    ] as const) {
      const missing = await call(api, op, { params: params as any, token: null });
      expectStatus(missing, 401);
      expect(missing.body.type).toBe('https://api.vandelay-industries.example/problems/unauthorized');
      expect(missing.headers.get('www-authenticate')).toBe('Bearer');
      expectStatus(await call(api, op, { params: params as any, token: 'not-a-real-token' }), 401);
    }
  });

  test('unknown routes return a problem document', async () => {
    const r = await fetch(`${BASE_URL}/claims/v1/nope`, { headers: { Authorization: `Bearer ${TOKENS.adjuster}` } });
    expect(r.status).toBe(404);
    expect(r.headers.get('content-type')).toContain('application/problem+json');
  });
});

describe('Customer API', () => {
  test('search requires a filter', async () => {
    const r = expectStatus(await call('customers', 'listCustomers', {}), 400);
    expect(r.title).toBe('Validation failed');
  });

  test('search by email matches the spec example', async () => {
    const r = expectStatus(await call('customers', 'listCustomers', { query: { email: 'marisol.vega@example.com' } }), 200);
    const example = ex('customers', 'listCustomers', 'byEmail', 'response').data[0];
    expect(r.data).toHaveLength(1);
    expect(r.data[0]).toMatchObject(example);
    expect(r.nextCursor).toBeNull();
  });

  test('search by phone and by case-insensitive last-name prefix', async () => {
    const byPhone = expectStatus(await call('customers', 'listCustomers', { query: { phone: '+14155550142' } }), 200);
    expect(byPhone.data.map((c: any) => c.id)).toEqual([MARISOL]);
    const byName = expectStatus(await call('customers', 'listCustomers', { query: { lastName: 've' } }), 200);
    expect(byName.data.every((c: any) => c.lastName.toLowerCase().startsWith('ve'))).toBe(true);
    expect(byName.data.map((c: any) => c.id)).toContain(MARISOL);
  });

  test('date of birth is masked without customers:pii:read', async () => {
    const masked = expectStatus(await call('customers', 'getCustomer', { params: { customerId: MARISOL }, token: TOKENS.agent }), 200);
    expect(masked).toMatchObject(withoutLocation(ex('customers', 'getCustomer', 'customer', 'response')));
    expect(masked.address).toEqual(CHARLOTTE);
    expect(masked.dateOfBirth).toBe('1988-**-**');
    const full = expectStatus(await call('customers', 'getCustomer', { params: { customerId: MARISOL }, token: TOKENS.adjuster }), 200);
    expect(full.dateOfBirth).toBe('1988-06-21');
  });

  test('unknown or malformed customer IDs return 404', async () => {
    expectStatus(await call('customers', 'getCustomer', { params: { customerId: 'cus_NOPE00' } }), 404);
    expectStatus(await call('customers', 'getCustomer', { params: { customerId: 'not-an-id' } }), 404);
  });

  test('creating a customer with an existing email returns 409 duplicate-customer', async () => {
    const r = expectStatus(await call('customers', 'createCustomer', { body: ex('customers', 'createCustomer', 'newCustomer') }), 409);
    expect(r.type).toBe('https://api.vandelay-industries.example/problems/duplicate-customer');
    expect(r.detail).toContain(MARISOL);
  });

  test('create validates the body against the spec', async () => {
    const r = expectStatus(await call('customers', 'createCustomer', { body: { firstName: 'No', lastName: 'Email' } }), 400);
    expect(r.errors).toContainEqual({ field: 'email', message: 'is required' });
    const bad = expectStatus(await call('customers', 'createCustomer', { body: { firstName: 'A', lastName: 'B', email: `a.${uid()}@example.com`, phone: '415-555-0100' } }), 400);
    expect(bad.errors[0].field).toBe('phone');
    expectStatus(await call('customers', 'createCustomer', { rawBody: '{not json' }), 400);
  });

  test('create a customer (idempotent) with Location header', async () => {
    const body = { ...ex('customers', 'createCustomer', 'newCustomer'), firstName: 'Mateo', email: `mateo.vega.${uid()}@example.com`, phone: '+14155550177' };
    const key = crypto.randomUUID();
    const r = await call('customers', 'createCustomer', { body, headers: { 'Idempotency-Key': key }, token: TOKENS.agent });
    const created = expectStatus(r, 201);
    expect(created.id).toMatch(/^cus_[A-Za-z0-9]+$/);
    expect(created.status).toBe('active');
    expect(created.dateOfBirth).toBe('1988-**-**');
    expect(r.headers.get('location')).toBe(`/customers/${created.id}`);
    const replay = await call('customers', 'createCustomer', { body, headers: { 'Idempotency-Key': key }, token: TOKENS.agent });
    expect(expectStatus(replay, 201).id).toBe(created.id);
    expect(replay.headers.get('idempotent-replayed')).toBe('true');
    const reuse = expectStatus(await call('customers', 'createCustomer', { body: { ...body, lastName: 'Different' }, headers: { 'Idempotency-Key': key }, token: TOKENS.agent }), 409);
    expect(reuse.title).toBe('Idempotency key reused');
    state.customer = created;
  });

  test('update a customer (spec example)', async () => {
    const body = ex('customers', 'updateCustomer', 'newPhone');
    const r = expectStatus(await call('customers', 'updateCustomer', { params: { customerId: state.customer.id }, body }), 200);
    expect(r.phone).toBe(body.phone);
    expect(r.address).toEqual(body.address);
    expect(Date.parse(r.updatedAt)).toBeGreaterThanOrEqual(Date.parse(state.customer.updatedAt));
    expectStatus(await call('customers', 'updateCustomer', { params: { customerId: state.customer.id }, body: {} }), 400);
    const dup = expectStatus(await call('customers', 'updateCustomer', { params: { customerId: state.customer.id }, body: { email: 'marisol.vega@example.com' } }), 400);
    expect(dup.errors[0].field).toBe('email');
    expectStatus(await call('customers', 'updateCustomer', { params: { customerId: 'cus_NOPE00' }, body }), 404);
  });

  test("list and add vehicles", async () => {
    const list = expectStatus(await call('customers', 'listCustomerVehicles', { params: { customerId: MARISOL } }), 200);
    const exampleVehicle = ex('customers', 'listCustomerVehicles', 'vehicles', 'response').data[0];
    expect(list.data).toEqual([{ ...exampleVehicle, licensePlate: 'PBK4123', licensePlateState: 'NC' }]);
    const body = ex('customers', 'addCustomerVehicle', 'accord');
    const created = expectStatus(await call('customers', 'addCustomerVehicle', { params: { customerId: state.customer.id }, body }), 201);
    expect(created).toMatchObject(body);
    expect(created.id).toMatch(/^veh_\d+$/);
    const dup = expectStatus(await call('customers', 'addCustomerVehicle', { params: { customerId: state.customer.id }, body }), 400);
    expect(dup.errors[0].message).toContain(created.id);
    expectStatus(await call('customers', 'addCustomerVehicle', { params: { customerId: state.customer.id }, body: { ...body, vin: 'IOQ00000000000000' } }), 400);
    expectStatus(await call('customers', 'addCustomerVehicle', { params: { customerId: state.customer.id }, body: { ...body, vin: 'SHORT' } }), 400);
    expectStatus(await call('customers', 'listCustomerVehicles', { params: { customerId: 'cus_NOPE00' } }), 404);
    expectStatus(await call('customers', 'addCustomerVehicle', { params: { customerId: 'cus_NOPE00' }, body }), 404);
  });

  test('get and replace communication preferences', async () => {
    const prefs = expectStatus(await call('customers', 'getCustomerPreferences', { params: { customerId: MARISOL } }), 200);
    expect(prefs).toEqual(ex('customers', 'getCustomerPreferences', 'prefs', 'response'));
    const body = ex('customers', 'replaceCustomerPreferences', 'emailPrefs');
    expect(expectStatus(await call('customers', 'replaceCustomerPreferences', { params: { customerId: state.customer.id }, body }), 200)).toEqual(body);
    expect(expectStatus(await call('customers', 'getCustomerPreferences', { params: { customerId: state.customer.id } }), 200)).toEqual(body);
    expectStatus(await call('customers', 'replaceCustomerPreferences', { params: { customerId: state.customer.id }, body: { contactMethod: 'fax' } }), 400);
    expectStatus(await call('customers', 'getCustomerPreferences', { params: { customerId: 'cus_NOPE00' } }), 404);
    expectStatus(await call('customers', 'replaceCustomerPreferences', { params: { customerId: 'cus_NOPE00' }, body }), 404);
  });

  test('delete requires customers:delete, refuses customers with open claims, and soft-deletes', async () => {
    expectStatus(await call('customers', 'deleteCustomer', { params: { customerId: state.customer.id }, token: TOKENS.adjuster }), 403);
    const open = expectStatus(await call('customers', 'deleteCustomer', { params: { customerId: MARISOL }, token: TOKENS.supervisor }), 409);
    expect(open.type).toBe('https://api.vandelay-industries.example/problems/open-claims');
    expect(open.detail).toContain(CLAIM);
    expectStatus(await call('customers', 'deleteCustomer', { params: { customerId: 'cus_NOPE00' }, token: TOKENS.supervisor }), 404);
    expectStatus(await call('customers', 'deleteCustomer', { params: { customerId: state.customer.id }, token: TOKENS.supervisor }), 204);
    const after = expectStatus(await call('customers', 'getCustomer', { params: { customerId: state.customer.id } }), 200);
    expect(after.status).toBe('inactive');
  });
});

describe('Policy API', () => {
  test("get the policy from the spec example, with coverages, vehicles, and drivers", async () => {
    const p = expectStatus(await call('policies', 'getPolicy', { params: { policyId: POLICY } }), 200);
    const example = ex('policies', 'getPolicy', 'policy', 'response');
    const { coverages, vehicles, drivers, ...base } = example;
    expect(p).toMatchObject(base);
    for (const c of coverages) expect(p.coverages).toContainEqual(c);
    expect(p.vehicles).toEqual(vehicles);
    expect(p.drivers).toEqual(drivers.map((d: any) => ({ ...d, licenseState: 'NC' })));
    state.premiumBefore = p.premium.amount;
    expectStatus(await call('policies', 'getPolicy', { params: { policyId: 'pol_AUT-000000' } }), 404);
    expectStatus(await call('policies', 'getPolicy', { params: { policyId: 'bogus' } }), 404);
  });

  test('list by customer shows the renewal history, newest first', async () => {
    const r = expectStatus(await call('policies', 'listPolicies', { query: { customerId: MARISOL } }), 200);
    expect(r.data.map((p: any) => p.status)).toEqual(['active', 'expired', 'expired']);
    expect(r.data[0]).toEqual(ex('policies', 'listPolicies', 'activePolicies', 'response').data[0]);
    expect(r.data[1].expirationDate).toBe(r.data[0].effectiveDate);
    const active = expectStatus(await call('policies', 'listPolicies', { query: { customerId: MARISOL, status: 'active' } }), 200);
    expect(active.data.map((p: any) => p.id)).toEqual([POLICY]);
  });

  test('find policies by VIN; unknown status filters match nothing', async () => {
    const r = expectStatus(await call('policies', 'listPolicies', { query: { vin: '1HGCM82633A004352' } }), 200);
    expect(r.data.length).toBe(3);
    expect(r.data.every((p: any) => p.customerId === MARISOL)).toBe(true);
    expect(expectStatus(await call('policies', 'listPolicies', { query: { status: 'bogus' } }), 200).data).toEqual([]);
  });

  test('pagination returns disjoint pages that cover the whole list', async () => {
    const all = await listAll('policies', 'listPolicies');
    const p1 = expectStatus(await call('policies', 'listPolicies', { query: { limit: 25 } }), 200);
    const p2 = expectStatus(await call('policies', 'listPolicies', { query: { limit: 25, cursor: p1.nextCursor } }), 200);
    expect(p1.data).toHaveLength(25);
    expect(p2.data.map((p: any) => p.id)).toEqual(all.slice(25, 50).map((p) => p.id));
  });

  test('coverages, vehicles, and drivers sub-resources', async () => {
    const cov = expectStatus(await call('policies', 'listPolicyCoverages', { params: { policyId: POLICY } }), 200);
    for (const c of ex('policies', 'listPolicyCoverages', 'coverages', 'response').data) expect(cov.data).toContainEqual(c);
    expect(expectStatus(await call('policies', 'listPolicyVehicles', { params: { policyId: POLICY } }), 200)).toEqual(ex('policies', 'listPolicyVehicles', 'vehicles', 'response'));
    expect(expectStatus(await call('policies', 'listPolicyDrivers', { params: { policyId: POLICY } }), 200).data)
      .toEqual(ex('policies', 'listPolicyDrivers', 'drivers', 'response').data.map((d: any) => ({ ...d, licenseState: 'NC' })));
    for (const op of ['listPolicyCoverages', 'listPolicyVehicles', 'listPolicyDrivers']) expectStatus(await call('policies', op, { params: { policyId: 'pol_AUT-000000' } }), 404);
  });

  test('verify coverage: covered collision returns the coverage and deductible', async () => {
    const r = expectStatus(await call('policies', 'verifyCoverage', { params: { policyId: POLICY }, body: ex('policies', 'verifyCoverage', 'collision') }), 200);
    const { verifiedAt, ...expected } = ex('policies', 'verifyCoverage', 'covered', 'response');
    expect(r).toMatchObject(expected);
    expect(Date.now() - Date.parse(r.verifiedAt)).toBeLessThan(60_000);
  });

  test('verify coverage: not-covered reasons for lapsed policies, uninsured vehicles, unlisted drivers, missing coverage', async () => {
    const lapsed = expectStatus(await call('policies', 'listPolicies', { query: { status: 'lapsed' } }), 200).data[0];
    const today = new Date().toISOString().slice(0, 10);
    const l = expectStatus(await call('policies', 'verifyCoverage', { params: { policyId: lapsed.id }, body: { lossDate: today, claimType: 'collision' } }), 200);
    expect(l.covered).toBe(false);
    expect(l.reasons[0].code).toBe('POLICY_LAPSED');
    expect(l.coverage).toBeUndefined();
    state.lapsedPolicy = lapsed;

    const v = expectStatus(await call('policies', 'verifyCoverage', { params: { policyId: POLICY }, body: { lossDate: '2026-10-02', claimType: 'collision', vehicleId: 'veh_0000', driverId: 'drv_0' } }), 200);
    expect(v.reasons.map((x: any) => x.code)).toEqual(['VEHICLE_NOT_ON_POLICY', 'DRIVER_NOT_LISTED']);

    const before = expectStatus(await call('policies', 'verifyCoverage', { params: { policyId: POLICY }, body: { lossDate: '2026-02-15', claimType: 'collision' } }), 200);
    expect(before.reasons[0].code).toBe('LOSS_BEFORE_EFFECTIVE_DATE');

    // A liability-only policy has no collision coverage.
    const active = await listAll('policies', 'listPolicies', { status: 'active' });
    let liabilityOnly: any;
    for (const p of active.filter((x) => x.product === 'personal_auto')) {
      const cov = expectStatus(await call('policies', 'listPolicyCoverages', { params: { policyId: p.id } }), 200).data;
      if (!cov.some((c: any) => c.code === 'COLL')) { liabilityOnly = p; break; }
    }
    expect(liabilityOnly).toBeDefined();
    const n = expectStatus(await call('policies', 'verifyCoverage', { params: { policyId: liabilityOnly.id }, body: { lossDate: today, claimType: 'collision' } }), 200);
    expect(n.reasons.map((x: any) => x.code)).toEqual(['COVERAGE_NOT_PURCHASED']);
  });

  test('verify coverage validates input', async () => {
    const future = expectStatus(await call('policies', 'verifyCoverage', { params: { policyId: POLICY }, body: { lossDate: '2099-01-01', claimType: 'collision' } }), 400);
    expect(future.errors).toContainEqual({ field: 'lossDate', message: 'must not be in the future' });
    expectStatus(await call('policies', 'verifyCoverage', { params: { policyId: POLICY }, body: { lossDate: '2026-10-02', claimType: 'meteor' } }), 400);
    expectStatus(await call('policies', 'verifyCoverage', { params: { policyId: 'pol_AUT-000000' }, body: { lossDate: '2026-10-02', claimType: 'collision' } }), 404);
  });

  test('add a driver re-rates the policy; duplicates and closed policies are rejected', async () => {
    const body = ex('policies', 'addPolicyDriver', 'spouse');
    const d = expectStatus(await call('policies', 'addPolicyDriver', { params: { policyId: POLICY }, body }), 201);
    const { id: _exampleId, ...createdExample } = ex('policies', 'addPolicyDriver', 'created', 'response', '201');
    expect(d).toMatchObject(createdExample);
    expect(d.id).toMatch(/^drv_\d+$/);
    expect(d).not.toHaveProperty('licenseNumber');
    const after = expectStatus(await call('policies', 'getPolicy', { params: { policyId: POLICY } }), 200);
    expect(after.premium.amount).toBeGreaterThan(state.premiumBefore);
    expect(after.drivers.map((x: any) => x.id)).toContain(d.id);
    const dup = expectStatus(await call('policies', 'addPolicyDriver', { params: { policyId: POLICY }, body }), 409);
    expect(dup.detail).toContain(d.id);
    const expired = expectStatus(await call('policies', 'listPolicies', { query: { customerId: MARISOL, status: 'expired' } }), 200).data[0];
    expectStatus(await call('policies', 'addPolicyDriver', { params: { policyId: expired.id }, body: { ...body, licenseNumber: 'D7654321' } }), 409);
    expectStatus(await call('policies', 'addPolicyDriver', { params: { policyId: POLICY }, body: { ...body, dateOfBirth: '2020-01-01' } }), 400);
    expectStatus(await call('policies', 'addPolicyDriver', { params: { policyId: 'pol_AUT-000000' }, body }), 404);
  });
});

describe('Vendors API', () => {
  test('search nearby in-network repair shops, sorted by distance', async () => {
    const r = expectStatus(await call('vendors', 'listVendors', { query: { type: 'repair', postalCode: '28202', radiusMiles: 25 } }), 200);
    expect(r.data.length).toBeGreaterThan(2);
    expect(r.data.every((v: any) => v.type === 'repair' && v.inNetwork && typeof v.distanceMiles === 'number')).toBe(true);
    const d = r.data.map((v: any) => v.distanceMiles);
    expect([...d].sort((a, b) => a - b)).toEqual(d);
    const ids = r.data.map((v: any) => v.id);
    expect(ids).toContain('ven_4417');
    expect(ids).toContain('ven_4502');
    expect(ids).not.toContain('ven_4733');
    const withOut = expectStatus(await call('vendors', 'listVendors', { query: { type: 'repair', postalCode: '28202', inNetwork: false } }), 200);
    expect(withOut.data.map((v: any) => v.id)).toContain('ven_4733');
    const jax = expectStatus(await call('vendors', 'listVendors', { query: { postalCode: '32207', radiusMiles: 10 } }), 200);
    expect(jax.data.length).toBeGreaterThan(0);
    expect(jax.data.every((v: any) => v.address.city === 'Jacksonville' && v.distanceMiles <= 10)).toBe(true);
  });

  test('search validates its parameters', async () => {
    expectStatus(await call('vendors', 'listVendors', { query: { radiusMiles: 10 } }), 400);
    expectStatus(await call('vendors', 'listVendors', { query: { type: 'plumber' } }), 400);
    expectStatus(await call('vendors', 'listVendors', { query: { postalCode: '10001' } }), 400);
    expectStatus(await call('vendors', 'listVendors', { query: { limit: 0 } }), 400);
  });

  test('get a vendor (spec example)', async () => {
    const v = expectStatus(await call('vendors', 'getVendor', { params: { vendorId: 'ven_4417' } }), 200);
    expect(v).toMatchObject(withoutLocation(ex('vendors', 'getVendor', 'vendor', 'response')));
    expect(v.address).toEqual({ addressLine1: '1215 S Tryon St', city: 'Charlotte', state: 'NC', postalCode: '28203', country: 'US' });
    expect(v.serviceAreaPostalCodes).toEqual(expect.arrayContaining(['28202', '28203', '28204']));
    expectStatus(await call('vendors', 'getVendor', { params: { vendorId: 'ven_1' } }), 404);
  });

  test('onboard a vendor (pending until verified); duplicate tax IDs conflict', async () => {
    const body = ex('vendors', 'createVendor', 'towCompany');
    const v = expectStatus(await call('vendors', 'createVendor', { body }), 201);
    const { taxId, ...visible } = body;
    expect(v).toMatchObject({ ...visible, status: 'pending' });
    expect(v).not.toHaveProperty('taxId');
    expect(v.id).toBe('ven_5100');
    const dup = expectStatus(await call('vendors', 'createVendor', { body: { ...body, email: `other.${uid()}@ggtowing.example.com` } }), 409);
    expect(dup.detail).toContain('ven_5100');
    expectStatus(await call('vendors', 'createVendor', { body: { ...body, taxId: undefined, email: undefined } }), 400);
    state.newVendor = v;
  });

  test('update a vendor: activate, then suspend (spec example) which drops it from the network', async () => {
    const active = expectStatus(await call('vendors', 'updateVendor', { params: { vendorId: state.newVendor.id }, body: { status: 'active' } }), 200);
    expect(active.status).toBe('active');
    const s = expectStatus(await call('vendors', 'updateVendor', { params: { vendorId: state.newVendor.id }, body: ex('vendors', 'updateVendor', 'suspend') }), 200);
    expect(s).toMatchObject({ status: 'suspended', inNetwork: false });
    expectStatus(await call('vendors', 'updateVendor', { params: { vendorId: state.newVendor.id }, body: { inNetwork: true } }), 400);
    expectStatus(await call('vendors', 'updateVendor', { params: { vendorId: 'ven_4962' }, body: { status: 'active' } }), 400);
    expectStatus(await call('vendors', 'updateVendor', { params: { vendorId: 'ven_1' }, body: { status: 'active' } }), 404);
  });

  test('work orders: list, filter, and get (spec example)', async () => {
    const wo = expectStatus(await call('vendors', 'getWorkOrder', { params: { workOrderId: 'wo_9001' } }), 200);
    expect(wo).toMatchObject(withoutLocation(ex('vendors', 'getWorkOrder', 'workOrder', 'response')));
    expect(wo.scheduledFor).toBe('2026-10-07T09:00:00-04:00');
    const forVendor = expectStatus(await call('vendors', 'listWorkOrders', { query: { vendorId: 'ven_4417' } }), 200);
    expect(forVendor.data.every((w: any) => w.vendorId === 'ven_4417')).toBe(true);
    expect(forVendor.data.map((w: any) => w.id)).toContain('wo_9001');
    const inProgress = expectStatus(await call('vendors', 'listWorkOrders', { query: { status: 'in_progress' } }), 200);
    expect(inProgress.data.every((w: any) => w.status === 'in_progress')).toBe(true);
    expectStatus(await call('vendors', 'getWorkOrder', { params: { workOrderId: 'wo_1' } }), 404);
  });
});

describe('Claims API', () => {
  test('get the claim from the spec examples', async () => {
    const c = expectStatus(await call('claims', 'getClaim', { params: { claimId: CLAIM } }), 200);
    const { status, updatedAt, ...example } = ex('claims', 'getClaim', 'underReview', 'response');
    expect(c).toMatchObject(withoutLocation(example));
    expect(c.lossLocation).toEqual({ addressLine1: '100 N Tryon St', city: 'Charlotte', state: 'NC', postalCode: '28202', country: 'US' });
    expect(c.policeReportNumber).toBe('CMPD-26-114382');
    expect(c.status).toBe('approved');
    expectStatus(await call('claims', 'getClaim', { params: { claimId: 'clm_2026-999999' } }), 404);
    expectStatus(await call('claims', 'getClaim', { params: { claimId: 'clm_x' } }), 404);
  });

  test('list claims newest first, filtered by status, customer, and policy', async () => {
    const submitted = expectStatus(await call('claims', 'listClaims', { query: { status: 'submitted' } }), 200);
    expect(submitted.data.length).toBeGreaterThan(0);
    expect(submitted.data.every((c: any) => c.status === 'submitted')).toBe(true);
    const mine = expectStatus(await call('claims', 'listClaims', { query: { customerId: MARISOL, policyId: POLICY } }), 200);
    expect(mine.data.map((c: any) => c.id)).toEqual([CLAIM]);
    const page = expectStatus(await call('claims', 'listClaims', { query: { limit: 5 } }), 200);
    expect(page.data).toHaveLength(5);
    expect(page.nextCursor).toEqual(expect.any(String));
    const next = expectStatus(await call('claims', 'listClaims', { query: { limit: 5, cursor: page.nextCursor } }), 200);
    expect(Date.parse(next.data[0].createdAt)).toBeLessThanOrEqual(Date.parse(page.data[4].createdAt));
    state.submittedClaim = submitted.data[0];
  });

  test('the spec collision example is rejected as a duplicate of the existing claim', async () => {
    const r = expectStatus(await call('claims', 'createClaim', { body: ex('claims', 'createClaim', 'collision') }), 409);
    expect(r.detail).toContain(CLAIM);
  });

  test('create a draft theft claim (spec example): coverage is verified and the COMP deductible applies', async () => {
    const key = crypto.randomUUID();
    const body = ex('claims', 'createClaim', 'theft');
    const r = await call('claims', 'createClaim', { body, headers: { 'Idempotency-Key': key }, token: TOKENS.agent });
    const c = expectStatus(r, 201);
    expect(c).toMatchObject({ customerId: MARISOL, policyId: POLICY, vehicleId: 'veh_7731', status: 'draft', type: 'theft', lossDate: '2026-09-28', estimatedAmount: null, assignedAdjusterId: null });
    expect(c.deductible).toEqual({ amount: 250, currency: 'USD' });
    expect(c.id).toMatch(/^clm_\d{4}-\d{6}$/);
    expect(r.headers.get('location')).toBe(`/claims/${c.id}`);
    const replay = await call('claims', 'createClaim', { body, headers: { 'Idempotency-Key': key }, token: TOKENS.agent });
    expect(expectStatus(replay, 201).id).toBe(c.id);
    const tl = expectStatus(await call('claims', 'getClaimTimeline', { params: { claimId: c.id } }), 200).data;
    expect(tl.map((e: any) => e.event)).toEqual(['claim.created', 'coverage.verified']);
    expect(tl[0].summary).toContain('agt_claims_assistant');
    state.theft = c;
  });

  test('claim creation enforces business rules', async () => {
    const base = ex('claims', 'createClaim', 'collision');
    const future = expectStatus(await call('claims', 'createClaim', { body: { ...base, lossDate: '2099-01-01' } }), 400);
    expect(future.errors).toContainEqual({ field: 'lossDate', message: 'must not be in the future' });
    expectStatus(await call('claims', 'createClaim', { body: { ...base, description: 'short' } }), 400);
    const lapsed = state.lapsedPolicy;
    const r = expectStatus(await call('claims', 'createClaim', { body: { ...base, customerId: lapsed.customerId, policyId: lapsed.id, vehicleId: undefined, lossDate: new Date().toISOString().slice(0, 10) } }), 422);
    expect(r.type).toBe('https://api.vandelay-industries.example/problems/policy-not-active');
    expect(r.detail).toMatch(/lapsed on \d{4}-\d{2}-\d{2}/);
    const mismatch = expectStatus(await call('claims', 'createClaim', { body: { ...base, customerId: lapsed.customerId } }), 422);
    expect(mismatch.type).toContain('policy-customer-mismatch');
    const notInsured = expectStatus(await call('claims', 'createClaim', { body: { ...base, lossDate: '2026-10-01', vehicleId: state.customerVehicle ?? 'veh_0001' } }), 422);
    expect(notInsured.type).toMatch(/vehicle-not-(found|on-policy)/);
  });

  test('claim lifecycle: draft -> submitted -> under_review -> approved, with guardrails', async () => {
    const id = state.theft.id;
    const skip = expectStatus(await call('claims', 'updateClaim', { params: { claimId: id }, body: { status: 'approved' } }), 409);
    expect(skip.title).toBe('Invalid state transition');
    expect(expectStatus(await call('claims', 'updateClaim', { params: { claimId: id }, body: { status: 'submitted' } }), 200).status).toBe('submitted');
    expectStatus(await call('claims', 'updateClaim', { params: { claimId: id }, body: { status: 'under_review' } }), 409);
    expectStatus(await call('claims', 'updateClaim', { params: { claimId: id }, body: { status: 'cancelled' } }), 409);
    expectStatus(await call('claims', 'updateClaim', { params: { claimId: id }, body: { assignedAdjusterId: 'adj_999' } }), 400);
    const review = expectStatus(await call('claims', 'updateClaim', { params: { claimId: id }, body: ex('claims', 'updateClaim', 'adjusterEstimate') }), 200);
    expect(review).toMatchObject({ status: 'under_review', assignedAdjusterId: 'adj_220', estimatedAmount: { amount: 4850, currency: 'USD' } });
    // Stolen vehicle not recovered: re-estimate as a total loss at ACV.
    const tl = expectStatus(await call('claims', 'updateClaim', { params: { claimId: id }, body: { estimatedAmount: { amount: 24350, currency: 'USD' }, description: 'Vehicle stolen from a parking garage overnight. Not recovered after 21 days; total loss.' } }), 200);
    expect(tl.estimatedAmount.amount).toBe(24350);
    expect(expectStatus(await call('claims', 'updateClaim', { params: { claimId: id }, body: { status: 'approved' } }), 200).status).toBe('approved');
    const locked = expectStatus(await call('claims', 'updateClaim', { params: { claimId: id }, body: { description: 'Trying to change an approved claim.' } }), 409);
    expect(locked.detail).toBe('Claim is approved and can no longer be modified.');
    expectStatus(await call('claims', 'updateClaim', { params: { claimId: 'clm_2026-999999' }, body: { status: 'submitted' } }), 404);
    const events = expectStatus(await call('claims', 'getClaimTimeline', { params: { claimId: id } }), 200).data.map((e: any) => e.summary);
    expect(events).toContain('Status changed from draft to submitted.');
    expect(events.some((s: string) => s.startsWith('Status changed from under_review to approved. Approved amount 24100.00 USD'))).toBe(true);
  });

  test('notes: oldest first; customers see only customer-visible notes', async () => {
    const all = expectStatus(await call('claims', 'listClaimNotes', { params: { claimId: CLAIM } }), 200).data;
    expect(all[0]).toEqual(ex('claims', 'listClaimNotes', 'notes', 'response').data[0]);
    const visible = expectStatus(await call('claims', 'listClaimNotes', { params: { claimId: CLAIM }, token: TOKENS.customer }), 200).data;
    expect(visible.length).toBeLessThan(all.length);
    expect(visible.every((n: any) => n.visibility === 'customer')).toBe(true);
    const body = ex('claims', 'addClaimNote', 'customerNote');
    const n = expectStatus(await call('claims', 'addClaimNote', { params: { claimId: CLAIM }, body, token: TOKENS.customer }), 201);
    expect(n).toMatchObject({ author: { type: 'customer', id: MARISOL }, visibility: 'customer', body: body.body });
    expect(n.id).toMatch(/^note_\d+$/);
    expectStatus(await call('claims', 'addClaimNote', { params: { claimId: CLAIM }, body: { visibility: 'internal', body: 'x' }, token: TOKENS.customer }), 400);
    const internal = expectStatus(await call('claims', 'addClaimNote', { params: { claimId: CLAIM }, body: { visibility: 'internal', body: 'Customer asked about scheduling; called back.' } }), 201);
    expect(internal.author).toEqual({ type: 'adjuster', id: 'adj_220' });
    expectStatus(await call('claims', 'addClaimNote', { params: { claimId: CLAIM }, body: {} }), 400);
    expectStatus(await call('claims', 'listClaimNotes', { params: { claimId: 'clm_2026-999999' } }), 404);
    expectStatus(await call('claims', 'addClaimNote', { params: { claimId: 'clm_2026-999999' }, body }), 404);
  });

  test('assignments: the spec example and eligibility rules', async () => {
    const list = expectStatus(await call('claims', 'listClaimAssignments', { params: { claimId: CLAIM } }), 200);
    expect(list.data[0]).toMatchObject({ id: 'asg_5521', claimId: CLAIM, vendorId: 'ven_4417', role: 'repair', scheduledFor: '2026-10-07T09:00:00-04:00' });
    const sub = state.submittedClaim;
    const body = { vendorId: 'ven_4417', role: 'repair', scheduledFor: '2026-10-27T09:00:00-04:00', instructions: 'Inspect and estimate.' };
    const outNet = expectStatus(await call('claims', 'assignVendorToClaim', { params: { claimId: sub.id }, body: { ...body, vendorId: 'ven_4733' } }), 422);
    expect(outNet.detail).toBe(`Vendor ven_4733 is not in the preferred network for ${sub.lossLocation?.state ?? 'NC'}.`);
    expectStatus(await call('claims', 'assignVendorToClaim', { params: { claimId: sub.id }, body: { ...body, vendorId: 'ven_4720' } }), 422);
    expectStatus(await call('claims', 'assignVendorToClaim', { params: { claimId: sub.id }, body: { ...body, vendorId: 'ven_4301' } }), 422);
    expectStatus(await call('claims', 'assignVendorToClaim', { params: { claimId: sub.id }, body: { ...body, vendorId: 'ven_9999' } }), 422);
    expectStatus(await call('claims', 'assignVendorToClaim', { params: { claimId: sub.id }, body: { role: 'repair' } }), 400);
    expectStatus(await call('claims', 'assignVendorToClaim', { params: { claimId: 'clm_2026-999999' }, body }), 404);
    expectStatus(await call('claims', 'listClaimAssignments', { params: { claimId: 'clm_2026-999999' } }), 404);

    // Find an in-network repair shop that serves the claim's loss location and assign it.
    const postal = sub.lossLocation?.postalCode ?? expectStatus(await call('customers', 'getCustomer', { params: { customerId: sub.customerId } }), 200).address.postalCode;
    const shops = expectStatus(await call('vendors', 'listVendors', { query: { type: 'repair', postalCode: postal } }), 200).data.filter((v: any) => v.status === 'active' && v.serviceAreaPostalCodes.includes(postal));
    expect(shops.length).toBeGreaterThan(0);
    const a = expectStatus(await call('claims', 'assignVendorToClaim', { params: { claimId: sub.id }, body: { ...body, vendorId: shops[0].id } }), 201);
    expect(a).toMatchObject({ claimId: sub.id, vendorId: shops[0].id, role: 'repair', status: 'requested', scheduledFor: body.scheduledFor });
    state.assignment = a;
  });

  test('timeline for the spec claim', async () => {
    const tl = expectStatus(await call('claims', 'getClaimTimeline', { params: { claimId: CLAIM } }), 200).data;
    const example = ex('claims', 'getClaimTimeline', 'timeline', 'response').data;
    for (const e of example) expect(tl).toContainEqual(e);
    expectStatus(await call('claims', 'getClaimTimeline', { params: { claimId: 'clm_2026-999999' } }), 404);
  });
});

describe('Vendors API: work order lifecycle (cross-API with Claims assignments)', () => {
  test('a new assignment is visible as an issued work order to the vendor', async () => {
    const wos = expectStatus(await call('vendors', 'listWorkOrders', { query: { claimId: state.submittedClaim.id, vendorId: state.assignment.vendorId } }), 200).data;
    const wo = wos.find((w: any) => w.createdAt === state.assignment.createdAt);
    expect(wo).toMatchObject({ type: 'repair', status: 'issued', instructions: 'Inspect and estimate.' });
    state.wo = wo;
  });

  test('vendor accepts, starts with an estimate (spec example), completes; assignment status follows', async () => {
    const id = state.wo.id;
    expectStatus(await call('vendors', 'updateWorkOrder', { params: { workOrderId: id }, body: { estimate: { amount: 100, currency: 'USD' } } }), 409);
    expectStatus(await call('vendors', 'updateWorkOrder', { params: { workOrderId: id }, body: { status: 'completed' } }), 409);
    expect(expectStatus(await call('vendors', 'updateWorkOrder', { params: { workOrderId: id }, body: { status: 'accepted' } }), 200).status).toBe('accepted');
    const body = ex('vendors', 'updateWorkOrder', 'submitEstimate');
    expect(expectStatus(await call('vendors', 'updateWorkOrder', { params: { workOrderId: id }, body }), 200)).toMatchObject(body);
    expectStatus(await call('vendors', 'updateWorkOrder', { params: { workOrderId: id }, body: { estimate: { amount: 10, currency: 'EUR' } } }), 400);
    expect(expectStatus(await call('vendors', 'updateWorkOrder', { params: { workOrderId: id }, body: { status: 'completed' } }), 200).status).toBe('completed');
    expectStatus(await call('vendors', 'updateWorkOrder', { params: { workOrderId: id }, body: { notes: 'too late' } }), 409);
    expectStatus(await call('vendors', 'updateWorkOrder', { params: { workOrderId: 'wo_1' }, body: { notes: 'x' } }), 404);
    const asg = expectStatus(await call('claims', 'listClaimAssignments', { params: { claimId: state.submittedClaim.id } }), 200).data;
    expect(asg.find((a: any) => a.id === state.assignment.id).status).toBe('completed');
    const tl = expectStatus(await call('claims', 'getClaimTimeline', { params: { claimId: state.submittedClaim.id } }), 200).data.map((e: any) => e.event);
    expect(tl).toContain('work_order.estimate_submitted');
  });

  test('issue a work order directly (spec example) and enforce vendor eligibility', async () => {
    const body = ex('vendors', 'createWorkOrder', 'repair');
    const r = await call('vendors', 'createWorkOrder', { body });
    const wo = expectStatus(r, 201);
    expect(wo).toMatchObject({ ...body, status: 'issued' });
    const asg = expectStatus(await call('claims', 'listClaimAssignments', { params: { claimId: CLAIM } }), 200).data;
    expect(asg).toHaveLength(2);
    const outOfArea = expectStatus(await call('vendors', 'createWorkOrder', { body: { ...body, vendorId: 'ven_4801' } }), 422);
    expect(outOfArea.detail).toBe('Vendor ven_4801 does not serve postal code 28202.');
    const pending = expectStatus(await call('vendors', 'createWorkOrder', { body: { ...body, vendorId: 'ven_4395', type: 'appraisal' } }), 422);
    expect(pending.type).toContain('vendor-not-active');
    expectStatus(await call('vendors', 'createWorkOrder', { body: { ...body, type: 'tow' } }), 422);
    expectStatus(await call('vendors', 'createWorkOrder', { body: { ...body, claimId: 'clm_2026-999999' } }), 404);
    expectStatus(await call('vendors', 'createWorkOrder', { body: { ...body, vendorId: 'ven_1' } }), 404);
    expectStatus(await call('vendors', 'createWorkOrder', { body: { claimId: CLAIM } }), 400);
  });
});

describe('Payments API', () => {
  test('list and get payments (spec examples)', async () => {
    const list = expectStatus(await call('payments', 'listPayments', { query: { claimId: CLAIM } }), 200);
    const example = ex('payments', 'listPayments', 'forClaim', 'response').data[0];
    expect(list.data.find((x: any) => x.id === example.id)).toMatchObject(example);
    const byPayee = expectStatus(await call('payments', 'listPayments', { query: { payeeId: 'ven_4417', status: 'completed' } }), 200);
    expect(byPayee.data.every((p: any) => p.payee.id === 'ven_4417' && p.status === 'completed')).toBe(true);
    const p = expectStatus(await call('payments', 'getPayment', { params: { paymentId: 'pay_90311' } }), 200);
    expect(p).toMatchObject(ex('payments', 'getPayment', 'completed', 'response'));
    expectStatus(await call('payments', 'getPayment', { params: { paymentId: 'pay_1' } }), 404);
    const refunds = expectStatus(await call('payments', 'listPaymentRefunds', { params: { paymentId: 'pay_90311' } }), 200);
    expect(refunds.data[0]).toMatchObject({ ...ex('payments', 'listPaymentRefunds', 'refunds', 'response').data[0] });
    expectStatus(await call('payments', 'listPaymentRefunds', { params: { paymentId: 'pay_1' } }), 404);
  });

  test('payment methods: list (spec example), add via token, reject reused tokens', async () => {
    const list = expectStatus(await call('payments', 'listPaymentMethods', { query: { payeeId: MARISOL } }), 200);
    expect(list).toEqual(ex('payments', 'listPaymentMethods', 'methods', 'response'));
    expectStatus(await call('payments', 'listPaymentMethods', {}), 400);
    expectStatus(await call('payments', 'listPaymentMethods', { query: { payeeId: 'cus_NOPE00' } }), 400);
    const body = { ...ex('payments', 'createPaymentMethod', 'bank'), payeeId: state.customer.id, token: `tok_bank_${uid()}${uid()}` };
    const pm = expectStatus(await call('payments', 'createPaymentMethod', { body }), 201);
    expect(pm).toMatchObject({ payeeId: state.customer.id, type: 'bank_account', isDefault: true });
    expect(pm.last4).toMatch(/^\d{4}$/);
    expect(pm.label).toBe(`Checking ending in ${pm.last4}`);
    expectStatus(await call('payments', 'createPaymentMethod', { body }), 400);
    expectStatus(await call('payments', 'createPaymentMethod', { body: { ...body, token: `tok_card_${uid()}${uid()}` } }), 400);
    expectStatus(await call('payments', 'createPaymentMethod', { body: { payeeId: MARISOL, type: 'bank_account' } }), 400);
  });

  test('creating payments requires payments:write and an Idempotency-Key', async () => {
    const body = ex('payments', 'createPayment', 'vendorInvoice');
    expectStatus(await call('payments', 'createPayment', { body, token: TOKENS.agent, headers: { 'Idempotency-Key': crypto.randomUUID() } }), 403);
    const missing = expectStatus(await call('payments', 'createPayment', { body }), 400);
    expect(missing.errors).toContainEqual({ field: 'Idempotency-Key', message: 'is required' });
  });

  test('payment business rules: duplicate invoice, approved balance, claim status, payee', async () => {
    const key = () => ({ 'Idempotency-Key': crypto.randomUUID() });
    const dupInvoice = expectStatus(await call('payments', 'createPayment', { body: ex('payments', 'createPayment', 'vendorInvoice'), headers: key() }), 409);
    expect(dupInvoice.detail).toBe('Invoice BCA-2026-1182 from ven_4417 was already paid (pay_90311).');
    // 4350.00 approved, 3850.00 paid, 200.00 refunded -> 700.00 remains.
    const over = expectStatus(await call('payments', 'createPayment', { body: { ...ex('payments', 'createPayment', 'vendorInvoice'), invoiceNumber: 'BCA-2026-1200', amount: { amount: 9000, currency: 'USD' } }, headers: key() }), 422);
    expect(over.detail).toBe('Requested 9000.00 USD but only 700.00 USD remains approved for claim clm_2026-000417.');
    const notApproved = expectStatus(await call('payments', 'createPayment', { body: { ...ex('payments', 'createPayment', 'customerSettlement'), claimId: state.submittedClaim.id, payee: { type: 'customer', id: state.submittedClaim.customerId } }, headers: key() }), 422);
    expect(notApproved.type).toContain('claim-not-approved');
    const wrongPayee = expectStatus(await call('payments', 'createPayment', { body: { ...ex('payments', 'createPayment', 'customerSettlement'), payee: { type: 'vendor', id: 'ven_4417' } }, headers: key() }), 422);
    expect(wrongPayee.type).toContain('invalid-payee');
    const wrongPm = expectStatus(await call('payments', 'createPayment', { body: { ...ex('payments', 'createPayment', 'customerSettlement'), paymentMethodId: 'pm_8802' }, headers: key() }), 422);
    expect(wrongPm.type).toContain('invalid-payment-method');
    expectStatus(await call('payments', 'createPayment', { body: { ...ex('payments', 'createPayment', 'customerSettlement'), amount: { amount: -5, currency: 'USD' } }, headers: key() }), 400);
  });

  test('pay the rental reimbursement on the spec claim; it settles via the bank and the claim is updated', async () => {
    const key = crypto.randomUUID();
    const body = { claimId: CLAIM, type: 'rental_reimbursement', payee: { type: 'customer', id: MARISOL }, paymentMethodId: 'pm_3321', amount: { amount: 480, currency: 'USD' }, memo: 'Rental reimbursement: 12 days at 40.00/day.' };
    const r = await call('payments', 'createPayment', { body, headers: { 'Idempotency-Key': key } });
    const p = expectStatus(r, 201);
    expect(p).toMatchObject({ claimId: CLAIM, status: 'processing', method: 'ach', amount: { amount: 480, currency: 'USD' } });
    expect(p.id).toMatch(/^pay_\d+$/);
    expect(r.headers.get('location')).toBe(`/payments/${p.id}`);
    expect(expectStatus(await call('payments', 'createPayment', { body, headers: { 'Idempotency-Key': key } }), 201).id).toBe(p.id);
    expectStatus(await call('payments', 'createPayment', { body: { ...body, amount: { amount: 1, currency: 'USD' } }, headers: { 'Idempotency-Key': key } }), 409);
    expectStatus(await call('payments', 'createPaymentRefund', { params: { paymentId: p.id }, body: { amount: { amount: 10, currency: 'USD' }, reason: 'overpayment' }, headers: { 'Idempotency-Key': crypto.randomUUID() } }), 422);
    const done = await waitFor(async () => {
      const g = expectStatus(await call('payments', 'getPayment', { params: { paymentId: p.id } }), 200);
      return g.status === 'completed' ? g : undefined;
    });
    expect(Date.parse(done.completedAt)).toBeGreaterThanOrEqual(Date.parse(done.createdAt));
    state.rentalPayment = done;
  }, 120_000);

  test('refund part of a completed payment; enforce refundable balance and idempotency', async () => {
    const id = state.rentalPayment.id;
    expectStatus(await call('payments', 'createPaymentRefund', { params: { paymentId: id }, body: ex('payments', 'createPaymentRefund', 'partial') }), 400);
    const ref = expectStatus(await call('payments', 'createPaymentRefund', { params: { paymentId: id }, body: { amount: { amount: 80, currency: 'USD' }, reason: 'overpayment' }, headers: { 'Idempotency-Key': crypto.randomUUID() } }), 201);
    expect(ref).toMatchObject({ paymentId: id, status: 'processing', reason: 'overpayment', amount: { amount: 80, currency: 'USD' } });
    expect(ref.id).toMatch(/^ref_\d+$/);
    const over = expectStatus(await call('payments', 'createPaymentRefund', { params: { paymentId: id }, body: { amount: { amount: 450, currency: 'USD' }, reason: 'other' }, headers: { 'Idempotency-Key': crypto.randomUUID() } }), 422);
    expect(over.detail).toBe(`Refundable balance on ${id} is 400.00 USD.`);
    expectStatus(await call('payments', 'createPaymentRefund', { params: { paymentId: 'pay_1' }, body: { amount: { amount: 1, currency: 'USD' }, reason: 'other' }, headers: { 'Idempotency-Key': crypto.randomUUID() } }), 404);
    const refunds = expectStatus(await call('payments', 'listPaymentRefunds', { params: { paymentId: id } }), 200).data;
    expect(refunds.map((r: any) => r.id)).toEqual([ref.id]);
  });

  test('cancel a processing payment (spec example); only in-flight payments can be cancelled', async () => {
    const body = { claimId: CLAIM, type: 'rental_reimbursement', payee: { type: 'customer', id: MARISOL }, paymentMethodId: 'pm_3321', amount: { amount: 40, currency: 'USD' } };
    const p = expectStatus(await call('payments', 'createPayment', { body, headers: { 'Idempotency-Key': crypto.randomUUID() } }), 201);
    const c = expectStatus(await call('payments', 'cancelPayment', { params: { paymentId: p.id }, body: ex('payments', 'cancelPayment', 'duplicate') }), 200);
    expect(c.status).toBe('cancelled');
    expectStatus(await call('payments', 'cancelPayment', { params: { paymentId: p.id }, body: { reason: 'other' } }), 409);
    expectStatus(await call('payments', 'cancelPayment', { params: { paymentId: 'pay_90311' }, body: { reason: 'other' } }), 409);
    expectStatus(await call('payments', 'cancelPayment', { params: { paymentId: 'pay_1' }, body: { reason: 'other' } }), 404);
    const bad = expectStatus(await call('payments', 'cancelPayment', { params: { paymentId: 'pay_90311' }, body: { reason: 'bored' } }), 400);
    expect(bad.errors[0].field).toBe('reason');
    expectStatus(await call('payments', 'cancelPayment', { params: { paymentId: 'pay_90311' }, rawBody: 'not json' }), 400);
  });

  test('large settlement: held for approval, approver must hold payments:approve and differ from the creator', async () => {
    const claim = state.theft;
    const body = { claimId: claim.id, type: 'settlement', payee: { type: 'customer', id: MARISOL }, paymentMethodId: 'pm_3321', amount: { amount: 24100, currency: 'USD' }, memo: 'Total loss payout net of deductible.' };
    const mine = expectStatus(await call('payments', 'createPayment', { body, token: TOKENS.supervisor, headers: { 'Idempotency-Key': crypto.randomUUID() } }), 201);
    expect(mine.status).toBe('pending_approval');
    const self = expectStatus(await call('payments', 'approvePayment', { params: { paymentId: mine.id }, body: { comment: 'self' }, token: TOKENS.supervisor }), 403);
    expect(self.detail).toBe('The approver must differ from the user who created the payment.');
    const over = expectStatus(await call('payments', 'createPayment', { body: { ...body, amount: { amount: 1, currency: 'USD' } }, headers: { 'Idempotency-Key': crypto.randomUUID() } }), 422);
    expect(over.detail).toContain('only 0.00 USD remains');
    expect(expectStatus(await call('payments', 'cancelPayment', { params: { paymentId: mine.id }, body: { reason: 'incorrect_payee' }, token: TOKENS.supervisor }), 200).status).toBe('cancelled');

    const held = expectStatus(await call('payments', 'createPayment', { body, token: TOKENS.adjuster, headers: { 'Idempotency-Key': crypto.randomUUID() } }), 201);
    expectStatus(await call('payments', 'approvePayment', { params: { paymentId: held.id }, token: TOKENS.adjuster }), 403);
    const approved = expectStatus(await call('payments', 'approvePayment', { params: { paymentId: held.id }, body: ex('payments', 'approvePayment', 'approve'), token: TOKENS.supervisor }), 200);
    expect(approved.status).toBe('processing');
    expectStatus(await call('payments', 'approvePayment', { params: { paymentId: held.id }, token: TOKENS.supervisor }), 409);
    expectStatus(await call('payments', 'approvePayment', { params: { paymentId: 'pay_1' }, token: TOKENS.supervisor }), 404);
    expectStatus(await call('payments', 'approvePayment', { params: { paymentId: held.id }, body: { comment: 42 }, token: TOKENS.supervisor }), 400);

    // Once the settlement clears, the claim's approved balance is fully paid and it settles.
    await waitFor(async () => {
      const g = expectStatus(await call('payments', 'getPayment', { params: { paymentId: held.id } }), 200);
      return g.status === 'completed' ? g : undefined;
    });
    const settled = await waitFor(async () => {
      const c = expectStatus(await call('claims', 'getClaim', { params: { claimId: claim.id } }), 200);
      return c.status === 'settled' ? c : undefined;
    }, 30_000);
    expect(settled.status).toBe('settled');
    const tl = expectStatus(await call('claims', 'getClaimTimeline', { params: { claimId: claim.id } }), 200).data.map((e: any) => e.event);
    expect(tl).toEqual(expect.arrayContaining(['payment.created', 'payment.approved', 'payment.completed', 'claim.status_changed']));
    // Settled claims can't be cancelled, and the customer still has open claims.
    expectStatus(await call('claims', 'cancelClaim', { params: { claimId: claim.id }, body: { reason: 'other' } }), 409);
  }, 150_000);

  test('a seeded total-loss settlement awaits supervisor approval', async () => {
    const pending = expectStatus(await call('payments', 'listPayments', { query: { status: 'pending_approval' } }), 200).data;
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0].type).toBe('settlement');
    expect(pending[0].amount.amount).toBeGreaterThan(10000);
  });
});

describe('Claims API: cancellation', () => {
  test('cancel a claim (spec example) cancels its open vendor work', async () => {
    const c = state.submittedClaim;
    const cancelled = expectStatus(await call('claims', 'cancelClaim', { params: { claimId: c.id }, body: ex('claims', 'cancelClaim', 'customerRequest') }), 200);
    expect(cancelled.status).toBe('cancelled');
    const asg = expectStatus(await call('claims', 'listClaimAssignments', { params: { claimId: c.id } }), 200).data;
    expect(asg.every((a: any) => ['completed', 'cancelled', 'declined'].includes(a.status))).toBe(true);
    expectStatus(await call('claims', 'cancelClaim', { params: { claimId: c.id }, body: { reason: 'other' } }), 409);
    expectStatus(await call('claims', 'cancelClaim', { params: { claimId: c.id }, body: { reason: 'bored' } }), 400);
    expectStatus(await call('claims', 'cancelClaim', { params: { claimId: 'clm_2026-999999' }, body: { reason: 'other' } }), 404);
  });
});

afterAll(() => {
  // Every operation in all five specs must have been exercised with a success response.
  const missing = allOperations().filter((k) => ![...(exercised.get(k) ?? [])].some((s) => s >= 200 && s < 300));
  expect(missing, 'operations never exercised successfully').toEqual([]);
});
