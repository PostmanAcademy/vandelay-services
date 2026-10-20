import { Hono } from 'hono';
import { query, one, nextId, tx, pool } from '../db';
import { badRequest, compact, conflict, money, notFound, opt, pageOf, parsePage, validBody, todayUtc, round2 } from '../lib/http';
import { toCoverage, verifyCoverage } from '../lib/domain';

const API = 'policies';
const ID_RE = /^pol_[A-Z]{3}-[0-9]+$/;
const STATUSES = ['quoted', 'active', 'lapsed', 'cancelled', 'expired'];

export function toPolicy(r: any) {
  return compact({
    id: r.id,
    policyNumber: r.policy_number,
    customerId: r.customer_id,
    product: r.product,
    status: r.status,
    effectiveDate: r.effective_date,
    expirationDate: r.expiration_date,
    premium: money(r.premium_amount, r.premium_currency ?? 'USD'),
    billingFrequency: opt(r.billing_frequency),
  });
}

export const toInsuredVehicle = (r: any) => ({ id: r.id, vin: r.vin, year: r.year, make: r.make, model: r.model });

export const toDriver = (r: any) =>
  compact({ id: r.id, firstName: r.first_name, lastName: r.last_name, licenseState: opt(r.license_state), relationship: r.relationship });

export async function findPolicy(id: string) {
  if (!ID_RE.test(id)) return undefined;
  return one(`SELECT * FROM policies WHERE id = $1`, [id]);
}

async function mustPolicy(id: string) {
  const p = await findPolicy(id);
  if (!p) throw notFound(`No policy exists with ID ${id}.`, 'Policy not found');
  return p;
}

const coveragesOf = (id: string) => query(`SELECT * FROM policy_coverages WHERE policy_id = $1 ORDER BY sort_order, code`, [id]);
const vehiclesOf = (id: string) =>
  query(`SELECT v.* FROM policy_vehicles pv JOIN vehicles v ON v.id = pv.vehicle_id WHERE pv.policy_id = $1 ORDER BY v.year DESC, v.id`, [id]);
const driversOf = (id: string) => query(`SELECT * FROM drivers WHERE policy_id = $1 ORDER BY CASE relationship WHEN 'self' THEN 0 WHEN 'spouse' THEN 1 ELSE 2 END, created_at, id`, [id]);

function ageOn(dob: string, on: string) {
  const [y, m, d] = dob.split('-').map(Number);
  const [y2, m2, d2] = on.split('-').map(Number);
  return y2 - y - (m2 < m || (m2 === m && d2 < d) ? 1 : 0);
}

export const policiesApi = new Hono();

policiesApi.get('/policies', async (c) => {
  // listPolicies documents no 400, so bad paging values fall back to defaults and an unknown
  // status simply matches nothing.
  const page = parsePage(c, false);
  const { customerId, status, vin } = c.req.query();
  const where: string[] = [];
  const params: unknown[] = [];
  if (customerId) where.push(`p.customer_id = $${params.push(customerId)}`);
  if (status) where.push(STATUSES.includes(status) ? `p.status = $${params.push(status)}` : 'false');
  if (vin) where.push(`EXISTS (SELECT 1 FROM policy_vehicles pv JOIN vehicles v ON v.id = pv.vehicle_id WHERE pv.policy_id = p.id AND v.vin = $${params.push(vin.toUpperCase())})`);
  const rows = await query(
    `SELECT p.* FROM policies p ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY p.effective_date DESC, p.id LIMIT ${page.limit + 1} OFFSET ${page.offset}`,
    params,
  );
  return c.json(pageOf(rows.map(toPolicy), page));
});

policiesApi.get('/policies/:policyId', async (c) => {
  const p = await mustPolicy(c.req.param('policyId'));
  const [coverages, vehicles, drivers] = await Promise.all([coveragesOf(p.id), vehiclesOf(p.id), driversOf(p.id)]);
  return c.json({
    ...toPolicy(p),
    coverages: coverages.map(toCoverage),
    vehicles: vehicles.map(toInsuredVehicle),
    drivers: drivers.map(toDriver),
  });
});

policiesApi.get('/policies/:policyId/coverages', async (c) => {
  const p = await mustPolicy(c.req.param('policyId'));
  return c.json({ data: (await coveragesOf(p.id)).map(toCoverage) });
});

policiesApi.get('/policies/:policyId/vehicles', async (c) => {
  const p = await mustPolicy(c.req.param('policyId'));
  return c.json({ data: (await vehiclesOf(p.id)).map(toInsuredVehicle) });
});

policiesApi.get('/policies/:policyId/drivers', async (c) => {
  const p = await mustPolicy(c.req.param('policyId'));
  return c.json({ data: (await driversOf(p.id)).map(toDriver) });
});

policiesApi.post('/policies/:policyId/drivers', async (c) => {
  const p = await mustPolicy(c.req.param('policyId'));
  const body = await validBody(c, API, 'addPolicyDriver');
  const errors = [];
  const today = todayUtc();
  if (body.dateOfBirth > today) errors.push({ field: 'dateOfBirth', message: 'must not be in the future' });
  else if (ageOn(body.dateOfBirth, today) < 15) errors.push({ field: 'dateOfBirth', message: 'driver must be at least 15 years old' });
  if (!/^[A-Z]{2}$/.test(body.licenseState)) errors.push({ field: 'licenseState', message: 'must be a two-letter state code' });
  if (!/^[A-Z0-9]{5,15}$/i.test(body.licenseNumber)) errors.push({ field: 'licenseNumber', message: 'must be 5-15 letters or digits' });
  if (errors.length) throw badRequest('Request body failed validation.', errors);

  if (!['active', 'quoted'].includes(p.status)) {
    throw conflict(`Policy ${p.id} is ${p.status}; drivers can only be added to active or quoted policies.`);
  }
  const licenseNumber = body.licenseNumber.toUpperCase();
  const existing = await driversOf(p.id);
  const dup = existing.find((d) => d.license_number === licenseNumber && d.license_state === body.licenseState);
  if (dup) throw conflict(`Driver with license ${body.licenseState} ${licenseNumber} is already listed on policy ${p.id} (${dup.id}).`);
  if (body.relationship === 'self' && existing.some((d) => d.relationship === 'self')) {
    throw conflict(`Policy ${p.id} already lists the policyholder as a driver.`);
  }

  const driver = await tx(async (db) => {
    const id = `drv_${await nextId('driver_seq', db)}`;
    const row = await one(
      `INSERT INTO drivers (id, policy_id, first_name, last_name, date_of_birth, license_number, license_state, relationship)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, p.id, body.firstName, body.lastName, body.dateOfBirth, licenseNumber, body.licenseState, body.relationship],
      db,
    );
    // Adding a driver re-rates the policy: youthful and senior drivers carry higher surcharges.
    if (p.premium_amount) {
      const age = ageOn(body.dateOfBirth, today);
      const factor = age < 25 ? 0.32 : age >= 70 ? 0.18 : 0.12;
      const perDriver = p.premium_amount / Math.max(1, existing.length);
      await one(`UPDATE policies SET premium_amount = $2, updated_at = now() WHERE id = $1`, [p.id, round2(p.premium_amount + perDriver * factor)], db);
    }
    return row;
  });
  return c.json(toDriver(driver), 201);
});

policiesApi.post('/policies/:policyId/coverage-verifications', async (c) => {
  const p = await mustPolicy(c.req.param('policyId'));
  const body = await validBody(c, API, 'verifyCoverage');
  if (body.lossDate > todayUtc()) throw badRequest('Request body failed validation.', [{ field: 'lossDate', message: 'must not be in the future' }]);
  const { _coverageRow, ...result } = await verifyCoverage(pool, p, body);
  await query(`INSERT INTO coverage_verifications (policy_id, request, result, verified_at) VALUES ($1, $2, $3, $4)`, [
    p.id, JSON.stringify(body), JSON.stringify(result), result.verifiedAt,
  ]);
  return c.json(result);
});
