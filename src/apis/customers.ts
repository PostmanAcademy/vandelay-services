import { Hono } from 'hono';
import { query, one, nextId } from '../db';
import {
  badRequest, compact, conflict, hasScope, idempotent, iso, notFound, opt, pageOf, parsePage, requireScope, SCOPES, validBody, todayUtc,
} from '../lib/http';
import { OPEN_CLAIM_STATUSES } from '../lib/domain';
import { randomBytes } from 'node:crypto';

const API = 'customers';
const ID_RE = /^cus_[A-Za-z0-9]+$/;
const E164 = /^\+[1-9]\d{7,14}$/;
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

export function toPreferences(r: any) {
  return compact({ contactMethod: opt(r.contact_method), language: opt(r.language), marketingOptIn: opt(r.marketing_opt_in) });
}

export function toAddress(r: any, prefix = '') {
  if (!r[`${prefix}address_line1`]) return undefined;
  return compact({
    addressLine1: r[`${prefix}address_line1`],
    addressLine2: opt(r[`${prefix}address_line2`]),
    city: r[`${prefix}city`],
    state: r[`${prefix}state`],
    postalCode: r[`${prefix}postal_code`],
    country: r[`${prefix}country`],
  });
}

export function toCustomer(r: any, pii: boolean) {
  const prefs = toPreferences(r);
  return compact({
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: opt(r.phone),
    dateOfBirth: r.date_of_birth ? (pii ? r.date_of_birth : `${r.date_of_birth.slice(0, 4)}-**-**`) : undefined,
    address: toAddress(r),
    status: r.status,
    preferences: Object.keys(prefs).length ? prefs : undefined,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
  });
}

export function toVehicle(r: any) {
  return compact({
    id: r.id,
    vin: r.vin,
    year: r.year,
    make: r.make,
    model: r.model,
    trim: opt(r.trim),
    color: opt(r.color),
    licensePlate: opt(r.license_plate),
    licensePlateState: opt(r.license_plate_state),
  });
}

async function findCustomer(id: string) {
  if (!ID_RE.test(id)) return undefined;
  return one(`SELECT * FROM customers WHERE id = $1`, [id]);
}

async function mustCustomer(id: string) {
  const c = await findCustomer(id);
  if (!c) throw notFound(`No customer exists with ID ${id}.`, 'Customer not found');
  return c;
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
async function newCustomerId(): Promise<string> {
  for (;;) {
    const bytes = randomBytes(4);
    const id = 'cus_01' + Array.from(bytes, (b) => CROCKFORD[b % 32]).join('');
    if (!(await one(`SELECT 1 FROM customers WHERE id = $1`, [id]))) return id;
  }
}

function checkContact(body: any) {
  const errors = [];
  if (body.phone !== undefined && !E164.test(body.phone)) errors.push({ field: 'phone', message: 'must be in E.164 format, e.g. +14155550142' });
  if (body.dateOfBirth !== undefined && body.dateOfBirth > todayUtc()) errors.push({ field: 'dateOfBirth', message: 'must not be in the future' });
  if (body.address?.country !== undefined && !/^[A-Z]{2}$/.test(body.address.country)) errors.push({ field: 'address.country', message: 'must be an ISO 3166-1 alpha-2 country code' });
  if (errors.length) throw badRequest('Request body failed validation.', errors);
}

export const customersApi = new Hono();

customersApi.get('/customers', async (c) => {
  const page = parsePage(c, true);
  const { email, phone, lastName } = c.req.query();
  if (!email && !phone && !lastName) {
    throw badRequest('At least one of email, phone, or lastName is required.', [{ field: 'email', message: 'or phone or lastName is required' }]);
  }
  const where: string[] = [];
  const params: unknown[] = [];
  if (email) where.push(`lower(email) = lower($${params.push(email)})`);
  if (phone) where.push(`phone = $${params.push(phone.replace(/^ /, '+').trim())}`);
  if (lastName) where.push(`lower(last_name) LIKE $${params.push(lastName.toLowerCase().replace(/[%_\\]/g, '\\$&') + '%')}`);
  const rows = await query(
    `SELECT * FROM customers WHERE ${where.join(' AND ')} ORDER BY last_name, first_name, id LIMIT ${page.limit + 1} OFFSET ${page.offset}`,
    params,
  );
  const pii = hasScope(c, SCOPES.PII_READ);
  return c.json(pageOf(rows.map((r) => toCustomer(r, pii)), page));
});

customersApi.post('/customers', async (c) => {
  const body = await validBody(c, API, 'createCustomer');
  return idempotent(c, { scope: 'createCustomer', required: false, body, mismatchStatus: 409 }, async () => {
    checkContact(body);
    const dup = await one(`SELECT id FROM customers WHERE lower(email) = lower($1)`, [body.email]);
    if (dup) throw conflict(`A customer with email ${body.email} already exists (${dup.id}).`, 'Customer already exists', 'duplicate-customer');
    const id = await newCustomerId();
    const a = body.address ?? {};
    const p = body.preferences ?? {};
    const row = await one(
      `INSERT INTO customers (id, first_name, last_name, email, phone, date_of_birth, address_line1, address_line2, city, state, postal_code, country,
         status, contact_method, language, marketing_opt_in, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, $14, $15, now(), now()) RETURNING *`,
      [id, body.firstName, body.lastName, body.email, body.phone ?? null, body.dateOfBirth ?? null, a.addressLine1 ?? null, a.addressLine2 ?? null,
        a.city ?? null, a.state ?? null, a.postalCode ?? null, a.country ?? null, p.contactMethod ?? null, p.language ?? null, p.marketingOptIn ?? null],
    );
    return { status: 201, body: toCustomer(row, hasScope(c, SCOPES.PII_READ)), headers: { Location: `/customers/${id}` } };
  });
});

customersApi.get('/customers/:customerId', async (c) => {
  const row = await mustCustomer(c.req.param('customerId'));
  return c.json(toCustomer(row, hasScope(c, SCOPES.PII_READ)));
});

customersApi.patch('/customers/:customerId', async (c) => {
  const id = c.req.param('customerId');
  await mustCustomer(id);
  const body = await validBody(c, API, 'updateCustomer');
  checkContact(body);
  const sets: string[] = [];
  const params: unknown[] = [id];
  const set = (col: string, v: unknown) => sets.push(`${col} = $${params.push(v)}`);
  if (body.firstName !== undefined) set('first_name', body.firstName);
  if (body.lastName !== undefined) set('last_name', body.lastName);
  if (body.email !== undefined) {
    const dup = await one(`SELECT id FROM customers WHERE lower(email) = lower($1) AND id <> $2`, [body.email, id]);
    if (dup) throw badRequest('Request body failed validation.', [{ field: 'email', message: `is already used by customer ${dup.id}` }]);
    set('email', body.email);
  }
  if (body.phone !== undefined) set('phone', body.phone);
  if (body.address !== undefined) {
    const a = body.address;
    set('address_line1', a.addressLine1);
    set('address_line2', a.addressLine2 ?? null);
    set('city', a.city);
    set('state', a.state);
    set('postal_code', a.postalCode);
    set('country', a.country);
  }
  if (!sets.length) throw badRequest('Request body must contain at least one updatable property.', [{ field: 'body', message: 'must contain at least one of firstName, lastName, email, phone, address' }]);
  const row = await one(`UPDATE customers SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`, params);
  return c.json(toCustomer(row, hasScope(c, SCOPES.PII_READ)));
});

customersApi.delete('/customers/:customerId', async (c) => {
  const id = c.req.param('customerId');
  requireScope(c, SCOPES.CUSTOMER_DELETE);
  await mustCustomer(id);
  const open = await query(`SELECT id FROM claims WHERE customer_id = $1 AND status = ANY($2) ORDER BY created_at`, [id, OPEN_CLAIM_STATUSES]);
  if (open.length) {
    throw conflict(
      `Customer ${id} has ${open.length} open claim${open.length > 1 ? 's' : ''} (${open.map((r) => r.id).join(', ')}).`,
      'Customer has open claims',
      'open-claims',
    );
  }
  await query(`UPDATE customers SET status = 'inactive', updated_at = now() WHERE id = $1 AND status <> 'inactive'`, [id]);
  return c.body(null, 204);
});

customersApi.get('/customers/:customerId/vehicles', async (c) => {
  const id = c.req.param('customerId');
  await mustCustomer(id);
  const rows = await query(`SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at, id`, [id]);
  return c.json({ data: rows.map(toVehicle) });
});

customersApi.post('/customers/:customerId/vehicles', async (c) => {
  const id = c.req.param('customerId');
  await mustCustomer(id);
  const body = await validBody(c, API, 'addCustomerVehicle');
  const vin = body.vin.toUpperCase();
  const errors = [];
  if (!VIN_RE.test(vin)) errors.push({ field: 'vin', message: 'must be 17 characters (letters except I, O, Q and digits)' });
  const maxYear = new Date().getUTCFullYear() + 1;
  if (body.year < 1981 || body.year > maxYear) errors.push({ field: 'year', message: `must be between 1981 and ${maxYear}` });
  if (errors.length) throw badRequest('Request body failed validation.', errors);
  const dup = await one(`SELECT id FROM vehicles WHERE customer_id = $1 AND vin = $2`, [id, vin]);
  if (dup) throw badRequest('Request body failed validation.', [{ field: 'vin', message: `is already registered to this customer as ${dup.id}` }]);
  const vehId = `veh_${await nextId('customer_vehicle_seq')}`;
  const row = await one(
    `INSERT INTO vehicles (id, customer_id, vin, year, make, model, trim, color, license_plate, license_plate_state)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [vehId, id, vin, body.year, body.make, body.model, body.trim ?? null, body.color ?? null, body.licensePlate ?? null, body.licensePlateState ?? null],
  );
  return c.json(toVehicle(row), 201);
});

customersApi.get('/customers/:customerId/preferences', async (c) => {
  const row = await mustCustomer(c.req.param('customerId'));
  return c.json(toPreferences(row));
});

customersApi.put('/customers/:customerId/preferences', async (c) => {
  const id = c.req.param('customerId');
  await mustCustomer(id);
  const body = await validBody(c, API, 'replaceCustomerPreferences');
  if (body.language !== undefined && !/^[a-z]{2,3}(-[A-Z]{2})?$/.test(body.language)) {
    throw badRequest('Request body failed validation.', [{ field: 'language', message: 'must be a language code such as en, es, or zh-TW' }]);
  }
  const row = await one(
    `UPDATE customers SET contact_method = $2, language = $3, marketing_opt_in = $4, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, body.contactMethod ?? null, body.language ?? null, body.marketingOptIn ?? null],
  );
  return c.json(toPreferences(row));
});
