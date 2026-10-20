import { Hono } from 'hono';
import { query, one, nextId, tx } from '../db';
import {
  badRequest, compact, conflict, fmtUsd, idempotent, iso, money, notFound, opt, pageOf, parsePage, principal, recordEvent, unprocessable, validBody,
} from '../lib/http';
import { toAddress } from './customers';
import { claimPostalCode, createEngagement, findClaim } from './claims';

const API = 'vendors';
const VENDOR_ID_RE = /^ven_[0-9]+$/;
const WO_ID_RE = /^wo_[0-9]+$/;
const VENDOR_TYPES = ['repair', 'tow', 'rental', 'glass', 'appraisal'];
const WO_STATUSES = ['issued', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled'];
const WO_TRANSITIONS: Record<string, string[]> = {
  issued: ['accepted', 'declined', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
};
const E164 = /^\+[1-9]\d{7,14}$/;

export function toVendor(r: any) {
  return compact({
    id: r.id,
    name: r.name,
    type: r.type,
    inNetwork: r.in_network,
    rating: opt(r.rating),
    distanceMiles: r.distance_miles === undefined || r.distance_miles === null ? undefined : Math.round(r.distance_miles * 10) / 10,
    phone: opt(r.phone),
    email: opt(r.email),
    address: toAddress(r),
    serviceAreaPostalCodes: r.service_area,
    status: r.status,
    createdAt: iso(r.created_at),
  });
}

export const toWorkOrder = (r: any) =>
  compact({
    id: r.id,
    claimId: r.claim_id,
    vendorId: r.vendor_id,
    type: r.type,
    status: r.status,
    estimate: money(r.estimate_amount, r.currency),
    scheduledFor: opt(r.scheduled_for),
    instructions: opt(r.instructions),
    notes: opt(r.notes),
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
  });

async function mustVendor(id: string) {
  const v = VENDOR_ID_RE.test(id) ? await one(`SELECT * FROM vendors WHERE id = $1`, [id]) : undefined;
  if (!v) throw notFound(`No vendor exists with ID ${id}.`, 'Vendor not found');
  return v;
}

async function mustWorkOrder(id: string) {
  const w = WO_ID_RE.test(id) ? await one(`SELECT * FROM work_orders WHERE id = $1`, [id]) : undefined;
  if (!w) throw notFound(`No work order exists with ID ${id}.`, 'Work order not found');
  return w;
}

const HAVERSINE = `3958.8 * 2 * asin(sqrt(power(sin(radians(v.latitude - z.latitude) / 2), 2)
  + cos(radians(z.latitude)) * cos(radians(v.latitude)) * power(sin(radians(v.longitude - z.longitude) / 2), 2)))`;

export const vendorsApi = new Hono();

vendorsApi.get('/vendors', async (c) => {
  const page = parsePage(c, true);
  const q = c.req.query();
  const errors = [];
  if (q.type && !VENDOR_TYPES.includes(q.type)) errors.push({ field: 'type', message: `must be one of: ${VENDOR_TYPES.join(', ')}` });
  let radius = 25;
  if (q.radiusMiles !== undefined) {
    radius = Number(q.radiusMiles);
    if (!Number.isInteger(radius) || radius < 1 || radius > 100) errors.push({ field: 'radiusMiles', message: 'must be an integer between 1 and 100' });
    else if (!q.postalCode) errors.push({ field: 'radiusMiles', message: 'requires postalCode' });
  }
  let inNetwork = true;
  if (q.inNetwork !== undefined) {
    if (!['true', 'false'].includes(q.inNetwork)) errors.push({ field: 'inNetwork', message: 'must be true or false' });
    inNetwork = q.inNetwork === 'true';
  }
  let origin: any;
  if (q.postalCode) {
    origin = await one(`SELECT * FROM postal_codes WHERE postal_code = $1`, [q.postalCode]);
    if (!origin) errors.push({ field: 'postalCode', message: `${q.postalCode} is outside Vandelay's service regions` });
  }
  if (errors.length) throw badRequest('Invalid query parameters.', errors);

  const where: string[] = [];
  const params: unknown[] = [];
  if (q.type) where.push(`v.type = $${params.push(q.type)}`);
  if (inNetwork) where.push('v.in_network');
  let sql: string;
  if (origin) {
    params.push(q.postalCode);
    sql = `SELECT * FROM (SELECT v.*, ${HAVERSINE} AS distance_miles FROM vendors v, postal_codes z
             WHERE z.postal_code = $${params.length} AND v.latitude IS NOT NULL ${where.length ? 'AND ' + where.join(' AND ') : ''}) s
           WHERE distance_miles <= $${params.push(radius)} ORDER BY distance_miles, id`;
  } else {
    sql = `SELECT v.* FROM vendors v ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY v.name, v.id`;
  }
  const rows = await query(`${sql} LIMIT ${page.limit + 1} OFFSET ${page.offset}`, params);
  return c.json(pageOf(rows.map(toVendor), page));
});

vendorsApi.post('/vendors', async (c) => {
  const body = await validBody(c, API, 'createVendor');
  return idempotent(c, { scope: 'createVendor', required: false, body, mismatchStatus: 409 }, async () => {
    const errors = [];
    if (!E164.test(body.phone)) errors.push({ field: 'phone', message: 'must be in E.164 format, e.g. +14155550111' });
    if (body.taxId !== undefined && !/^\d{2}-\d{7}$/.test(body.taxId)) errors.push({ field: 'taxId', message: 'must be an EIN in the form 12-3456789' });
    for (const [i, z] of (body.serviceAreaPostalCodes ?? []).entries()) {
      if (!/^\d{5}$/.test(z)) errors.push({ field: `serviceAreaPostalCodes.${i}`, message: 'must be a 5-digit postal code' });
    }
    if (errors.length) throw badRequest('Request body failed validation.', errors);
    if (body.taxId) {
      const dup = await one(`SELECT id FROM vendors WHERE tax_id = $1`, [body.taxId]);
      if (dup) throw conflict(`A vendor with tax ID ${body.taxId} already exists (${dup.id}).`, 'Vendor already exists', 'duplicate-vendor');
    }
    const dupEmail = await one(`SELECT id FROM vendors WHERE lower(email) = lower($1)`, [body.email]);
    if (dupEmail) throw conflict(`A vendor with email ${body.email} already exists (${dupEmail.id}).`, 'Vendor already exists', 'duplicate-vendor');
    const geo = await one(`SELECT latitude, longitude FROM postal_codes WHERE postal_code = $1`, [body.address.postalCode]);
    const id = `ven_${await nextId('vendor_seq')}`;
    const a = body.address;
    const row = await one(
      `INSERT INTO vendors (id, name, type, tax_id, in_network, phone, email, address_line1, address_line2, city, state, postal_code, country,
         latitude, longitude, service_area, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending', now(), now()) RETURNING *`,
      [id, body.name, body.type, body.taxId ?? null, body.inNetwork ?? false, body.phone, body.email, a.addressLine1, a.addressLine2 ?? null, a.city, a.state,
        a.postalCode, a.country, geo?.latitude ?? null, geo?.longitude ?? null, JSON.stringify(body.serviceAreaPostalCodes ?? [a.postalCode])],
    );
    return { status: 201, body: toVendor(row), headers: { Location: `/vendors/${id}` } };
  });
});

vendorsApi.get('/vendors/:vendorId', async (c) => c.json(toVendor(await mustVendor(c.req.param('vendorId')))));

vendorsApi.patch('/vendors/:vendorId', async (c) => {
  const v = await mustVendor(c.req.param('vendorId'));
  const body = await validBody(c, API, 'updateVendor');
  const errors = [];
  if (body.phone !== undefined && !E164.test(body.phone)) errors.push({ field: 'phone', message: 'must be in E.164 format' });
  if (body.email !== undefined) {
    const dup = await one(`SELECT id FROM vendors WHERE lower(email) = lower($1) AND id <> $2`, [body.email, v.id]);
    if (dup) errors.push({ field: 'email', message: `is already used by vendor ${dup.id}` });
  }
  if (v.status === 'terminated') errors.push({ field: 'status', message: 'terminated vendors cannot be modified' });
  const status = body.status ?? v.status;
  // Suspended or terminated vendors drop out of the preferred network.
  const inNetwork = ['suspended', 'terminated'].includes(status) ? false : body.inNetwork ?? v.in_network;
  if (body.inNetwork === true && status !== 'active') errors.push({ field: 'inNetwork', message: `cannot be true while the vendor is ${status}` });
  if (errors.length) throw badRequest('Request body failed validation.', errors);
  const row = await one(
    `UPDATE vendors SET name = $2, phone = $3, email = $4, in_network = $5, status = $6, updated_at = now() WHERE id = $1 RETURNING *`,
    [v.id, body.name ?? v.name, body.phone ?? v.phone, body.email ?? v.email, inNetwork, status],
  );
  return c.json(toVendor(row));
});

vendorsApi.get('/work-orders', async (c) => {
  const page = parsePage(c, false);
  const { vendorId, claimId, status } = c.req.query();
  const where: string[] = [];
  const params: unknown[] = [];
  if (vendorId) where.push(`vendor_id = $${params.push(vendorId)}`);
  if (claimId) where.push(`claim_id = $${params.push(claimId)}`);
  if (status) where.push(WO_STATUSES.includes(status) ? `status = $${params.push(status)}` : 'false');
  const rows = await query(
    `SELECT * FROM work_orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC, id DESC LIMIT ${page.limit + 1} OFFSET ${page.offset}`,
    params,
  );
  return c.json(pageOf(rows.map(toWorkOrder), page));
});

vendorsApi.post('/work-orders', async (c) => {
  const body = await validBody(c, API, 'createWorkOrder');
  const who = principal(c);
  return idempotent(c, { scope: 'createWorkOrder', required: false, body, mismatchStatus: 400 }, async () => {
    if (body.scheduledFor && Number.isNaN(Date.parse(body.scheduledFor))) {
      throw badRequest('Request body failed validation.', [{ field: 'scheduledFor', message: 'must be a valid date-time' }]);
    }
    const claim = await findClaim(body.claimId);
    if (!claim) throw notFound(`No claim exists with ID ${body.claimId}.`, 'Claim not found');
    const vendor = VENDOR_ID_RE.test(body.vendorId) ? await one(`SELECT * FROM vendors WHERE id = $1`, [body.vendorId]) : undefined;
    if (!vendor) throw notFound(`No vendor exists with ID ${body.vendorId}.`, 'Vendor not found');
    if (['closed', 'cancelled', 'denied', 'settled'].includes(claim.status)) {
      throw unprocessable('claim-not-open', 'Claim not open', `Claim ${claim.id} is ${claim.status}; work orders can only be issued for open claims.`);
    }
    if (vendor.status !== 'active') {
      throw unprocessable('vendor-not-active', 'Vendor not active', `Vendor ${vendor.id} is ${vendor.status} and cannot receive work orders.`);
    }
    if (vendor.type !== body.type) {
      throw unprocessable('vendor-type-mismatch', 'Vendor cannot perform this work', `Vendor ${vendor.id} is a ${vendor.type} vendor and cannot perform ${body.type} work.`);
    }
    const postal = await claimPostalCode(claim);
    if (postal && !vendor.service_area.includes(postal)) {
      throw unprocessable('vendor-out-of-area', 'Vendor does not serve this area', `Vendor ${vendor.id} does not serve postal code ${postal}.`);
    }
    const row = await tx((db) => createEngagement(db, claim, vendor, body, who, 'work_order'));
    return { status: 201, body: toWorkOrder(row), headers: { Location: `/work-orders/${row.id}` } };
  });
});

vendorsApi.get('/work-orders/:workOrderId', async (c) => c.json(toWorkOrder(await mustWorkOrder(c.req.param('workOrderId')))));

vendorsApi.patch('/work-orders/:workOrderId', async (c) => {
  const wo = await mustWorkOrder(c.req.param('workOrderId'));
  const body = await validBody(c, API, 'updateWorkOrder');
  const who = principal(c);
  const errors = [];
  if (body.estimate) {
    if (body.estimate.currency !== wo.currency.trim()) errors.push({ field: 'estimate.currency', message: `must be ${wo.currency.trim()}` });
    if (body.estimate.amount < 0) errors.push({ field: 'estimate.amount', message: 'must not be negative' });
  }
  if (body.scheduledFor && Number.isNaN(Date.parse(body.scheduledFor))) errors.push({ field: 'scheduledFor', message: 'must be a valid date-time' });
  if (errors.length) throw badRequest('Request body failed validation.', errors);

  if (!WO_TRANSITIONS[wo.status]) throw conflict(`Work order is ${wo.status} and can no longer be updated.`, 'Invalid state transition');
  const target = body.status && body.status !== wo.status ? body.status : undefined;
  if (target && !WO_TRANSITIONS[wo.status].includes(target)) {
    throw conflict(`Cannot change work order status from ${wo.status} to ${target}. Allowed: ${WO_TRANSITIONS[wo.status].join(', ')}.`, 'Invalid state transition');
  }
  if (body.estimate && wo.status === 'issued' && !['accepted', 'in_progress'].includes(target ?? '')) {
    throw conflict('Accept the work order before submitting an estimate.', 'Invalid state transition');
  }
  const estimate = body.estimate?.amount ?? wo.estimate_amount;
  if (target === 'completed' && (estimate === null || estimate === undefined)) {
    throw conflict('Submit an estimate before completing the work order.', 'Invalid state transition');
  }
  const vendor = await one(`SELECT name FROM vendors WHERE id = $1`, [wo.vendor_id]);
  const row = await tx(async (db) => {
    const r = await one(
      `UPDATE work_orders SET status = $2, estimate_amount = $3, scheduled_for = $4, notes = $5, updated_at = now() WHERE id = $1 RETURNING *`,
      [wo.id, target ?? wo.status, estimate ?? null, body.scheduledFor ?? wo.scheduled_for, body.notes ?? wo.notes],
      db,
    );
    if (target) {
      await recordEvent(db, wo.claim_id, 'work_order.status_changed', `Work order ${wo.id} (${vendor.name}) status changed from ${wo.status} to ${target}.`, who);
    }
    if (body.estimate && body.estimate.amount !== wo.estimate_amount) {
      await recordEvent(db, wo.claim_id, 'work_order.estimate_submitted', `${vendor.name} submitted an estimate of ${fmtUsd(body.estimate.amount)} on work order ${wo.id}.`, who);
    }
    if (body.scheduledFor && body.scheduledFor !== wo.scheduled_for) {
      await recordEvent(db, wo.claim_id, 'work_order.scheduled', `Work order ${wo.id} scheduled for ${body.scheduledFor}.`, who);
    }
    return r;
  });
  return c.json(toWorkOrder(row));
});
