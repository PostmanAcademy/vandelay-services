/**
 * Cross-API data integrity, checked only through the public APIs.
 *
 * Walks the whole book of business and verifies the relationships a production system would
 * guarantee: claims reference real customers, policies, and insured vehicles; losses fall inside
 * the policy term; deductibles match the coverage; vendor assignments mirror work orders;
 * payments stay within approved amounts; settled claims are fully paid.
 */
import { describe, test, expect, beforeAll } from 'bun:test';
import { call, expectStatus, listAll, resetData, ADMIN_TOKEN } from './helpers';

const CLAIM_COVERAGE: Record<string, string[]> = {
  collision: ['COLL'], comprehensive: ['COMP'], theft: ['COMP'], glass: ['GLASS', 'COMP'], vandalism: ['COMP'], weather: ['COMP'], liability: ['PD', 'CSL'], other: [],
};
const ASSIGNMENT_STATUS: Record<string, string> = { issued: 'requested', accepted: 'accepted', declined: 'declined', in_progress: 'in_progress', completed: 'completed', cancelled: 'cancelled' };

let claims: any[] = [];
const policies = new Map<string, any>();
const customers = new Map<string, any>();

beforeAll(async () => {
  if (ADMIN_TOKEN && process.env.SKIP_RESET !== '1') await resetData();
  claims = await listAll('claims', 'listClaims');
}, 120_000);

describe('book of business', () => {
  test('has a realistic volume and mix of claims', () => {
    expect(claims.length).toBeGreaterThanOrEqual(45);
    const statuses = new Set(claims.map((c) => c.status));
    for (const s of ['draft', 'submitted', 'under_review', 'approved', 'denied', 'settled', 'closed', 'cancelled']) expect(statuses).toContain(s);
    const types = new Set(claims.map((c) => c.type));
    for (const t of ['collision', 'comprehensive', 'theft', 'glass', 'vandalism', 'weather', 'liability', 'other']) expect(types).toContain(t);
  });

  test('claims are listed newest first', () => {
    const times = claims.map((c) => Date.parse(c.createdAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  test('every claim references a real customer, their policy, and a vehicle insured on that policy', async () => {
    for (const c of claims) {
      if (!customers.has(c.customerId)) customers.set(c.customerId, expectStatus(await call('customers', 'getCustomer', { params: { customerId: c.customerId } }), 200));
      if (!policies.has(c.policyId)) policies.set(c.policyId, expectStatus(await call('policies', 'getPolicy', { params: { policyId: c.policyId } }), 200));
      const p = policies.get(c.policyId);
      expect(p.customerId, `${c.id} policy owner`).toBe(c.customerId);
      if (c.vehicleId) {
        expect(p.vehicles.map((v: any) => v.id), `${c.id} vehicle on policy`).toContain(c.vehicleId);
        const owned = expectStatus(await call('customers', 'listCustomerVehicles', { params: { customerId: c.customerId } }), 200);
        expect(owned.data.map((v: any) => v.id), `${c.id} vehicle owned by customer`).toContain(c.vehicleId);
      }
    }
  }, 120_000);

  test('every loss date falls within the policy term, before the claim was filed', () => {
    for (const c of claims) {
      const p = policies.get(c.policyId);
      expect(c.lossDate >= p.effectiveDate && c.lossDate < p.expirationDate, `${c.id} loss ${c.lossDate} in ${p.effectiveDate}..${p.expirationDate}`).toBe(true);
      expect(c.lossDate <= c.createdAt.slice(0, 10), `${c.id} filed after loss`).toBe(true);
      expect(Date.parse(c.updatedAt) >= Date.parse(c.createdAt)).toBe(true);
    }
  });

  test("each claim's deductible is the deductible of the coverage that pays for its loss type", () => {
    for (const c of claims) {
      const p = policies.get(c.policyId);
      const cov = CLAIM_COVERAGE[c.type].map((code) => p.coverages.find((x: any) => x.code === code)).find(Boolean);
      if (cov?.deductible) expect(c.deductible, `${c.id} deductible`).toEqual(cov.deductible);
      else expect(c.deductible, `${c.id} has no deductible`).toBeUndefined();
    }
  });

  test('open claims belong to active customers; claims in review or later have an adjuster', () => {
    for (const c of claims) {
      if (['draft', 'submitted', 'under_review', 'approved', 'settled'].includes(c.status)) expect(customers.get(c.customerId).status, c.id).toBe('active');
      if (['under_review', 'approved', 'denied', 'settled', 'closed'].includes(c.status)) expect(c.assignedAdjusterId, c.id).toMatch(/^adj_\d+$/);
      if (['approved', 'settled'].includes(c.status)) expect(c.estimatedAmount, c.id).not.toBeNull();
    }
  });

  test('vendor assignments (Claims API) mirror work orders (Vendors API)', async () => {
    let total = 0;
    for (const c of claims) {
      const asg = expectStatus(await call('claims', 'listClaimAssignments', { params: { claimId: c.id } }), 200).data;
      const wos = expectStatus(await call('vendors', 'listWorkOrders', { query: { claimId: c.id, limit: 100 } }), 200).data;
      expect(asg.length, c.id).toBe(wos.length);
      for (const a of asg) {
        const wo = wos.find((w: any) => w.vendorId === a.vendorId && w.type === a.role && w.createdAt === a.createdAt);
        expect(wo, `${a.id} has a matching work order`).toBeDefined();
        expect(a.status).toBe(ASSIGNMENT_STATUS[wo.status]);
        const vendor = expectStatus(await call('vendors', 'getVendor', { params: { vendorId: a.vendorId } }), 200);
        expect(vendor.type, `${a.id} vendor type`).toBe(a.role);
        const postal = c.lossLocation?.postalCode ?? customers.get(c.customerId).address?.postalCode;
        expect(vendor.serviceAreaPostalCodes, `${vendor.id} serves ${postal}`).toContain(postal);
      }
      if (['draft', 'cancelled'].includes(c.status)) continue;
      total += asg.length;
    }
    expect(total).toBeGreaterThan(30);
  }, 120_000);

  test('payments reference approved-or-later claims, valid payees, and their payment methods', async () => {
    const payments = await listAll('payments', 'listPayments');
    expect(payments.length).toBeGreaterThan(25);
    const byId = new Map(claims.map((c) => [c.id, c]));
    for (const p of payments) {
      const c = byId.get(p.claimId);
      expect(c, `${p.id} claim exists`).toBeDefined();
      expect(['approved', 'settled', 'closed', 'cancelled'], `${p.id} claim status`).toContain(c.status);
      if (p.payee.type === 'customer') expect(p.payee.id, `${p.id} pays the claimant`).toBe(c.customerId);
      else {
        const wos = expectStatus(await call('vendors', 'listWorkOrders', { query: { claimId: c.id, vendorId: p.payee.id } }), 200).data;
        expect(wos.length, `${p.id} vendor worked the claim`).toBeGreaterThan(0);
      }
      if (p.paymentMethodId) {
        const methods = expectStatus(await call('payments', 'listPaymentMethods', { query: { payeeId: p.payee.id } }), 200).data;
        expect(methods.map((m: any) => m.id), `${p.id} method belongs to payee`).toContain(p.paymentMethodId);
        const pm = methods.find((m: any) => m.id === p.paymentMethodId);
        expect(p.method).toBe(pm.type === 'debit_card' ? 'card' : 'ach');
      }
      if (p.status === 'completed' || p.status === 'refunded') expect(Date.parse(p.completedAt) >= Date.parse(p.createdAt)).toBe(true);
    }
  }, 120_000);

  test('paid amounts never exceed the approved amount; settled and closed claims are paid in full', async () => {
    for (const c of claims) {
      const pays = expectStatus(await call('payments', 'listPayments', { query: { claimId: c.id, limit: 100 } }), 200).data;
      if (!['approved', 'settled', 'closed', 'cancelled'].includes(c.status)) {
        expect(pays.length, `${c.id} (${c.status}) has no payments`).toBe(0);
        continue;
      }
      if (!pays.length) continue;
      const approved = Math.round(((c.estimatedAmount?.amount ?? 0) - (c.deductible?.amount ?? 0)) * 100) / 100;
      let committed = 0;
      let completed = 0;
      for (const p of pays) {
        if (p.type === 'premium_refund' || ['cancelled', 'failed'].includes(p.status)) continue;
        const refunds = expectStatus(await call('payments', 'listPaymentRefunds', { params: { paymentId: p.id } }), 200).data;
        const refunded = refunds.filter((r: any) => r.status !== 'failed').reduce((s: number, r: any) => s + r.amount.amount, 0);
        committed += p.amount.amount - refunded;
        if (p.status === 'completed' || p.status === 'refunded') completed += p.amount.amount - refunded;
      }
      expect(Math.round(committed * 100) / 100, `${c.id} committed <= approved`).toBeLessThanOrEqual(approved + 0.001);
      if (['settled', 'closed'].includes(c.status)) {
        expect(Math.round(completed * 100) / 100, `${c.id} fully paid`).toBeCloseTo(approved, 2);
      }
    }
  }, 120_000);

  test('timelines are chronological and start with claim creation and coverage verification', async () => {
    for (const c of claims) {
      const events = expectStatus(await call('claims', 'getClaimTimeline', { params: { claimId: c.id } }), 200).data;
      expect(events[0].event, c.id).toBe('claim.created');
      expect(events[1].event, c.id).toBe('coverage.verified');
      const times = events.map((e: any) => Date.parse(e.at));
      expect([...times].sort((a, b) => a - b), `${c.id} chronological`).toEqual(times);
      expect(events[0].at).toBe(c.createdAt);
    }
  }, 120_000);

  test('every address is in one of Vandelay\'s eight Southeast markets', async () => {
    const markets: Record<string, string> = { Knoxville: 'TN', Asheville: 'NC', Greenville: 'SC', Charlotte: 'NC', Jacksonville: 'FL', Charleston: 'SC', Memphis: 'TN', Chattanooga: 'TN' };
    const inMarket = (a: any, what: string) => expect(markets[a.city] === a.state ? null : a, `${what} address outside the Southeast markets`).toBeNull();
    for (const c of claims) if (c.lossLocation) inMarket(c.lossLocation, c.id);
    for (const cus of customers.values()) if (cus.address) inMarket(cus.address, cus.id);
    const vendors = await listAll('vendors', 'listVendors', { inNetwork: 'false' });
    expect(vendors.length).toBeGreaterThan(50);
    for (const v of vendors) inMarket(v.address, v.id);
    expect(new Set(vendors.map((v: any) => v.address.city)).size).toBe(8);
    expect(new Set(claims.map((c) => c.lossLocation?.city).filter(Boolean)).size).toBe(8);
  }, 60_000);

  test('policy terms are coherent: renewals chain, one in-force personal auto term per customer', async () => {
    const all = await listAll('policies', 'listPolicies');
    expect(all.length).toBeGreaterThan(120);
    const byCustomer = new Map<string, any[]>();
    for (const p of all) byCustomer.set(p.customerId, [...(byCustomer.get(p.customerId) ?? []), p]);
    for (const [cus, ps] of byCustomer) {
      const activeAuto = ps.filter((p) => p.status === 'active' && p.product === 'personal_auto');
      expect(activeAuto.length, `${cus} active personal auto terms`).toBeLessThanOrEqual(1);
      for (const p of ps) expect(p.id).toBe(`pol_${p.policyNumber}`);
    }
    const statuses = new Set(all.map((p) => p.status));
    for (const s of ['quoted', 'active', 'lapsed', 'cancelled', 'expired']) expect(statuses).toContain(s);
    const products = new Set(all.map((p) => p.product));
    for (const s of ['personal_auto', 'commercial_auto', 'motorcycle', 'classic_car']) expect(products).toContain(s);
  }, 60_000);
});
