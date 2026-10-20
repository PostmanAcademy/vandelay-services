import { Hono } from 'hono';
import type { PoolClient } from 'pg';
import { query, one, nextId, tx, pool, type Db } from '../db';
import {
  badRequest, compact, conflict, fmtUsd, idempotent, iso, money, notFound, opt, pageOf, parsePage, principal, recordEvent,
  unprocessable, validBody, todayUtc, type Principal,
} from '../lib/http';
import { claimBalance, settleDue, verifyCoverage, type ClaimType } from '../lib/domain';

const API = 'claims';
const ID_RE = /^clm_[0-9]{4}-[0-9]{6}$/;
const STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'denied', 'settled', 'closed', 'cancelled'];
const MODIFIABLE = ['draft', 'submitted', 'under_review'];
const TRANSITIONS: Record<string, string[]> = { draft: ['submitted'], submitted: ['under_review'], under_review: ['approved', 'denied'] };

export const ASSIGNMENT_STATUS: Record<string, string> = {
  issued: 'requested', accepted: 'accepted', declined: 'declined', in_progress: 'in_progress', completed: 'completed', cancelled: 'cancelled',
};

export function toClaim(r: any) {
  return compact({
    id: r.id,
    customerId: r.customer_id,
    policyId: r.policy_id,
    vehicleId: opt(r.vehicle_id),
    status: r.status,
    type: r.type,
    lossDate: r.loss_date,
    lossLocation: r.loss_location
      ? compact({
        addressLine1: r.loss_location.addressLine1,
        addressLine2: opt(r.loss_location.addressLine2),
        city: r.loss_location.city,
        state: r.loss_location.state,
        postalCode: r.loss_location.postalCode,
        country: r.loss_location.country,
      })
      : undefined,
    description: opt(r.description),
    drivable: opt(r.drivable),
    injuries: opt(r.injuries),
    policeReportNumber: r.police_report_number ?? null,
    estimatedAmount: money(r.estimated_amount, r.currency) ?? null,
    deductible: money(r.deductible_amount, r.currency),
    assignedAdjusterId: r.assigned_adjuster_id ?? null,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
  });
}

export const toAssignment = (r: any) =>
  compact({
    id: r.assignment_id,
    claimId: r.claim_id,
    vendorId: r.vendor_id,
    role: r.type,
    status: ASSIGNMENT_STATUS[r.status],
    scheduledFor: opt(r.scheduled_for),
    createdAt: iso(r.created_at)!,
  });

const toNote = (r: any) => ({
  id: r.id,
  author: { type: r.author_type, id: r.author_id },
  visibility: r.visibility,
  body: r.body,
  createdAt: iso(r.created_at)!,
});

const toEvent = (r: any) =>
  compact({ at: iso(r.at)!, event: r.event, actor: r.actor_type ? { type: r.actor_type, id: r.actor_id } : undefined, summary: r.summary });

export async function findClaim(id: string, db: Db = pool) {
  if (!ID_RE.test(id)) return undefined;
  return one(`SELECT * FROM claims WHERE id = $1`, [id], db);
}

async function mustClaim(id: string, db: Db = pool) {
  const claim = await findClaim(id, db);
  if (!claim) throw notFound(`No claim exists with ID ${id}.`, 'Claim not found');
  return claim;
}

/** Postal code used to decide whether a vendor serves a claim: loss location, else the customer's address. */
export async function claimPostalCode(claim: any, db: Db = pool): Promise<string | undefined> {
  if (claim.loss_location?.postalCode) return claim.loss_location.postalCode;
  return (await one(`SELECT postal_code FROM customers WHERE id = $1`, [claim.customer_id], db))?.postal_code ?? undefined;
}

export const actorOf = (p: Principal) => ({ type: p.actorType, id: p.sub });

/** Cancels a claim's open vendor work. Used when a claim is cancelled or denied. */
async function cancelOpenWork(db: PoolClient, claimId: string, who: Principal, why: string) {
  const wos = await query(
    `UPDATE work_orders SET status = 'cancelled', updated_at = now() WHERE claim_id = $1 AND status IN ('issued', 'accepted', 'in_progress') RETURNING id, assignment_id`,
    [claimId],
    db,
  );
  for (const w of wos) await recordEvent(db, claimId, 'assignment.cancelled', `Assignment ${w.assignment_id} (work order ${w.id}) cancelled: ${why}.`, who);
}

export const claimsApi = new Hono();

claimsApi.use('*', async (_c, next) => {
  await settleDue();
  await next();
});

claimsApi.get('/claims', async (c) => {
  const page = parsePage(c, false);
  const { status, customerId, policyId } = c.req.query();
  const where: string[] = [];
  const params: unknown[] = [];
  if (status) where.push(STATUSES.includes(status) ? `status = $${params.push(status)}` : 'false');
  if (customerId) where.push(`customer_id = $${params.push(customerId)}`);
  if (policyId) where.push(`policy_id = $${params.push(policyId)}`);
  const rows = await query(
    `SELECT * FROM claims ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC, id DESC LIMIT ${page.limit + 1} OFFSET ${page.offset}`,
    params,
  );
  return c.json(pageOf(rows.map(toClaim), page));
});

claimsApi.post('/claims', async (c) => {
  const body = await validBody(c, API, 'createClaim');
  const who = principal(c);
  return idempotent(c, { scope: 'createClaim', required: false, body, mismatchStatus: 409 }, async () => {
    if (body.lossDate > todayUtc()) throw badRequest('Request body failed validation.', [{ field: 'lossDate', message: 'must not be in the future' }]);

    const customer = await one(`SELECT * FROM customers WHERE id = $1`, [body.customerId]);
    if (!customer) throw unprocessable('customer-not-found', 'Customer not found', `No customer exists with ID ${body.customerId}.`);
    if (customer.status !== 'active') throw unprocessable('customer-not-active', 'Customer not active', `Customer ${customer.id} is ${customer.status} and cannot file new claims.`);
    const policy = await one(`SELECT * FROM policies WHERE id = $1`, [body.policyId]);
    if (!policy) throw unprocessable('policy-not-found', 'Policy not found', `No policy exists with ID ${body.policyId}.`);
    if (policy.customer_id !== customer.id) {
      throw unprocessable('policy-customer-mismatch', 'Policy does not belong to customer', `Policy ${policy.id} does not belong to customer ${customer.id}.`);
    }
    if (body.vehicleId) {
      const v = await one(`SELECT customer_id FROM vehicles WHERE id = $1`, [body.vehicleId]);
      if (!v) throw unprocessable('vehicle-not-found', 'Vehicle not found', `No vehicle exists with ID ${body.vehicleId}.`);
    }

    // Same call the Policy API exposes as POST /policies/{policyId}/coverage-verifications.
    const verification = await verifyCoverage(pool, policy, { lossDate: body.lossDate, claimType: body.type as ClaimType, vehicleId: body.vehicleId });
    if (!verification.covered) {
      const reason = verification.reasons[0];
      if (['POLICY_LAPSED', 'POLICY_CANCELLED', 'POLICY_EXPIRED', 'POLICY_NOT_IN_FORCE', 'LOSS_BEFORE_EFFECTIVE_DATE'].includes(reason.code)) {
        const end = policy.status === 'lapsed' ? `lapsed on ${policy.status_date}` : policy.status === 'cancelled' ? `was cancelled on ${policy.status_date}`
          : policy.status === 'quoted' ? 'is a quote' : body.lossDate < policy.effective_date ? `took effect on ${policy.effective_date}` : `expired on ${policy.expiration_date}`;
        throw unprocessable('policy-not-active', 'Policy not active on loss date', `Policy ${policy.id} ${end} and was not active on ${body.lossDate}.`);
      }
      if (reason.code === 'VEHICLE_NOT_ON_POLICY') throw unprocessable('vehicle-not-on-policy', 'Vehicle not on policy', reason.message);
      throw unprocessable('coverage-not-included', 'Coverage not included', reason.message);
    }

    const dup = await one(
      `SELECT id FROM claims WHERE policy_id = $1 AND loss_date = $2 AND type = $3 AND vehicle_id IS NOT DISTINCT FROM $4 AND status <> 'cancelled'`,
      [policy.id, body.lossDate, body.type, body.vehicleId ?? null],
    );
    if (dup) throw conflict(`Claim ${dup.id} already exists for this ${body.type} loss on ${body.lossDate}.`, 'Duplicate claim', 'duplicate-claim');

    const status = body.submit ? 'submitted' : 'draft';
    const cov = verification._coverageRow;
    const claim = await tx(async (db) => {
      const year = new Date().getUTCFullYear();
      const id = `clm_${year}-${String(await nextId('claim_seq', db)).padStart(6, '0')}`;
      const row = await one(
        `INSERT INTO claims (id, customer_id, policy_id, vehicle_id, status, type, loss_date, loss_location, description, drivable, injuries,
           police_report_number, deductible_amount, coverage_code, created_by_type, created_by_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now(), now()) RETURNING *`,
        [id, customer.id, policy.id, body.vehicleId ?? null, status, body.type, body.lossDate, body.lossLocation ? JSON.stringify(body.lossLocation) : null,
          body.description, body.drivable ?? null, body.injuries ?? null, body.policeReportNumber ?? null, cov?.deductible_amount ?? null, cov?.code ?? null,
          who.actorType, who.sub],
        db,
      );
      const { _coverageRow, ...result } = verification;
      await query(`INSERT INTO coverage_verifications (policy_id, claim_id, request, result, verified_at) VALUES ($1, $2, $3, $4, $5)`, [
        policy.id, id, JSON.stringify({ lossDate: body.lossDate, claimType: body.type, vehicleId: body.vehicleId }), JSON.stringify(result), result.verifiedAt,
      ], db);
      const onBehalf = who.actorType === 'customer' ? '' : ` by ${who.sub} on behalf of ${customer.id}`;
      await recordEvent(db, id, 'claim.created', status === 'submitted' ? `Claim created and submitted${onBehalf}.` : `Claim created as draft${onBehalf}.`, who, row.created_at);
      await recordEvent(db, id, 'coverage.verified',
        cov ? `Coverage verified against policy ${policy.id}: ${cov.name}${cov.deductible_amount != null ? `, deductible ${fmtUsd(cov.deductible_amount)}` : ''}.`
          : `Policy ${policy.id} active on loss date; coverage to be determined by adjuster.`,
        { type: 'system', id: 'sys_policy_api' }, row.created_at);
      return row;
    });
    return { status: 201, body: toClaim(claim), headers: { Location: `/claims/${claim.id}` } };
  });
});

claimsApi.get('/claims/:claimId', async (c) => c.json(toClaim(await mustClaim(c.req.param('claimId')))));

claimsApi.patch('/claims/:claimId', async (c) => {
  const claim = await mustClaim(c.req.param('claimId'));
  const body = await validBody(c, API, 'updateClaim');
  const who = principal(c);

  const errors = [];
  let adjuster: any;
  if (body.assignedAdjusterId !== undefined) {
    adjuster = await one(`SELECT * FROM adjusters WHERE id = $1`, [body.assignedAdjusterId]);
    if (!adjuster) errors.push({ field: 'assignedAdjusterId', message: `no adjuster exists with ID ${body.assignedAdjusterId}` });
  }
  if (body.estimatedAmount) {
    if (body.estimatedAmount.currency !== claim.currency.trim()) errors.push({ field: 'estimatedAmount.currency', message: `must be ${claim.currency.trim()}` });
    if (body.estimatedAmount.amount < 0) errors.push({ field: 'estimatedAmount.amount', message: 'must not be negative' });
  }
  if (body.description !== undefined && body.description.trim().length < 10) errors.push({ field: 'description', message: 'must be at least 10 characters' });
  if (errors.length) throw badRequest('Request body failed validation.', errors);

  if (!MODIFIABLE.includes(claim.status)) {
    throw conflict(`Claim is ${claim.status} and can no longer be modified.`, 'Invalid state transition');
  }
  const target = body.status && body.status !== claim.status ? body.status : undefined;
  if (target === 'cancelled') throw conflict(`Use POST /claims/${claim.id}/cancel to cancel a claim.`, 'Invalid state transition');
  if (target && !TRANSITIONS[claim.status]?.includes(target)) {
    throw conflict(`Cannot change claim status from ${claim.status} to ${target}. Allowed: ${(TRANSITIONS[claim.status] ?? []).join(', ') || 'none'}.`, 'Invalid state transition');
  }
  const adjusterId = body.assignedAdjusterId ?? claim.assigned_adjuster_id;
  const estimate = body.estimatedAmount?.amount ?? claim.estimated_amount;
  if (target === 'under_review' && !adjusterId) {
    throw conflict('Assign an adjuster (assignedAdjusterId) before moving the claim to under_review.', 'Invalid state transition');
  }
  if (target === 'approved' && (estimate === null || estimate === undefined)) {
    throw conflict('Set estimatedAmount before approving the claim.', 'Invalid state transition');
  }

  const updated = await tx(async (db) => {
    const row = await one(
      `UPDATE claims SET status = $2, description = $3, assigned_adjuster_id = $4, estimated_amount = $5, updated_at = now() WHERE id = $1 RETURNING *`,
      [claim.id, target ?? claim.status, body.description ?? claim.description, adjusterId ?? null, estimate ?? null],
      db,
    );
    if (adjuster && adjuster.id !== claim.assigned_adjuster_id) {
      await recordEvent(db, claim.id, 'claim.adjuster_assigned', `Adjuster ${adjuster.id} (${adjuster.first_name} ${adjuster.last_name}) assigned.`, who);
    }
    if (body.estimatedAmount && body.estimatedAmount.amount !== claim.estimated_amount) {
      await recordEvent(db, claim.id, 'claim.estimate_updated', `Estimate set to ${fmtUsd(body.estimatedAmount.amount)}.`, who);
    }
    if (body.description !== undefined && body.description !== claim.description) {
      await recordEvent(db, claim.id, 'claim.updated', 'Loss description updated.', who);
    }
    if (target) {
      let summary = `Status changed from ${claim.status} to ${target}.`;
      if (target === 'approved') {
        const bal = await claimBalance(db, row);
        summary += ` Approved amount ${fmtUsd(bal.approved)} (estimate ${fmtUsd(row.estimated_amount)} less ${fmtUsd(row.deductible_amount ?? 0)} deductible).`;
      }
      await recordEvent(db, claim.id, 'claim.status_changed', summary, who);
      if (target === 'denied') await cancelOpenWork(db, claim.id, who, 'claim denied');
    }
    return row;
  });
  return c.json(toClaim(updated));
});

claimsApi.post('/claims/:claimId/cancel', async (c) => {
  const claim = await mustClaim(c.req.param('claimId'));
  const body = await validBody(c, API, 'cancelClaim');
  const who = principal(c);
  if (['settled', 'closed'].includes(claim.status)) {
    throw conflict(`Claim is ${claim.status} and can no longer be modified or cancelled.`, 'Invalid state transition');
  }
  if (claim.status === 'cancelled') throw conflict('Claim is already cancelled.', 'Invalid state transition');
  const row = await tx(async (db) => {
    const r = await one(
      `UPDATE claims SET status = 'cancelled', cancel_reason = $2, cancel_comment = $3, updated_at = now() WHERE id = $1 RETURNING *`,
      [claim.id, body.reason, body.comment ?? null],
      db,
    );
    await recordEvent(db, claim.id, 'claim.cancelled', `Claim cancelled (${body.reason})${body.comment ? `: ${body.comment}` : '.'}`, who);
    await cancelOpenWork(db, claim.id, who, 'claim cancelled');
    const pays = await query(
      `UPDATE payments SET status = 'cancelled', cancel_reason = 'claim_cancelled', updated_at = now()
       WHERE claim_id = $1 AND status IN ('pending_approval', 'processing') RETURNING id, amount`,
      [claim.id],
      db,
    );
    for (const p of pays) await recordEvent(db, claim.id, 'payment.cancelled', `Payment ${p.id} of ${fmtUsd(p.amount)} cancelled: claim cancelled.`, who);
    return r;
  });
  return c.json(toClaim(row));
});

claimsApi.get('/claims/:claimId/notes', async (c) => {
  const claim = await mustClaim(c.req.param('claimId'));
  const customerView = principal(c).actorType === 'customer';
  const rows = await query(
    `SELECT * FROM claim_notes WHERE claim_id = $1 ${customerView ? `AND visibility = 'customer'` : ''} ORDER BY created_at, id`,
    [claim.id],
  );
  return c.json({ data: rows.map(toNote) });
});

claimsApi.post('/claims/:claimId/notes', async (c) => {
  const claim = await mustClaim(c.req.param('claimId'));
  const body = await validBody(c, API, 'addClaimNote');
  if (!body.body.trim()) throw badRequest('Request body failed validation.', [{ field: 'body', message: 'must not be blank' }]);
  const who = principal(c);
  const visibility = body.visibility ?? 'customer';
  if (who.actorType === 'customer' && visibility === 'internal') {
    throw badRequest('Request body failed validation.', [{ field: 'visibility', message: 'customers can only add customer-visible notes' }]);
  }
  const note = await tx(async (db) => {
    const id = `note_${String(await nextId('note_seq', db)).padStart(3, '0')}`;
    const row = await one(
      `INSERT INTO claim_notes (id, claim_id, author_type, author_id, visibility, body, created_at) VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING *`,
      [id, claim.id, who.actorType, who.sub, visibility, body.body],
      db,
    );
    await recordEvent(db, claim.id, 'note.added', `${visibility === 'internal' ? 'Internal' : 'Customer-visible'} note ${id} added by ${who.actorType} ${who.sub}.`, who, row.created_at);
    return row;
  });
  return c.json(toNote(note), 201);
});

claimsApi.get('/claims/:claimId/assignments', async (c) => {
  const claim = await mustClaim(c.req.param('claimId'));
  const rows = await query(`SELECT * FROM work_orders WHERE claim_id = $1 ORDER BY created_at, id`, [claim.id]);
  return c.json({ data: rows.map(toAssignment) });
});

/** Creates the vendor engagement shared by Claims (assignment) and Vendors (work order). */
export async function createEngagement(
  db: PoolClient,
  claim: any,
  vendor: any,
  input: { type: string; scheduledFor?: string; instructions?: string },
  who: Principal,
  source: 'assignment' | 'work_order',
) {
  const woId = `wo_${await nextId('work_order_seq', db)}`;
  const asgId = `asg_${await nextId('assignment_seq', db)}`;
  const row = await one(
    `INSERT INTO work_orders (id, assignment_id, claim_id, vendor_id, type, status, scheduled_for, instructions, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'issued', $6, $7, now(), now()) RETURNING *`,
    [woId, asgId, claim.id, vendor.id, input.type, input.scheduledFor ?? null, input.instructions ?? null],
    db,
  );
  await recordEvent(db, claim.id, source === 'assignment' ? 'assignment.created' : 'work_order.created',
    `${vendor.name} (${vendor.id}) requested for ${input.type} (assignment ${asgId}, work order ${woId}).`, who, row.created_at);
  return row;
}

claimsApi.post('/claims/:claimId/assignments', async (c) => {
  const claim = await mustClaim(c.req.param('claimId'));
  const body = await validBody(c, API, 'assignVendorToClaim');
  const who = principal(c);
  if (body.scheduledFor && Number.isNaN(Date.parse(body.scheduledFor))) {
    throw badRequest('Request body failed validation.', [{ field: 'scheduledFor', message: 'must be a valid date-time' }]);
  }
  if (['closed', 'cancelled', 'denied', 'settled'].includes(claim.status)) {
    throw unprocessable('claim-not-open', 'Claim not open', `Claim ${claim.id} is ${claim.status}; vendors can only be assigned to open claims.`);
  }
  const vendor = await one(`SELECT * FROM vendors WHERE id = $1`, [body.vendorId]);
  const notEligible = (detail: string) => unprocessable('vendor-not-eligible', 'Vendor not eligible', detail);
  if (!vendor) throw notEligible(`Vendor ${body.vendorId} does not exist.`);
  if (vendor.status !== 'active') throw notEligible(`Vendor ${vendor.id} is ${vendor.status} and cannot accept assignments.`);
  const postal = await claimPostalCode(claim);
  const state = claim.loss_location?.state ?? vendor.state;
  if (!vendor.in_network) throw notEligible(`Vendor ${vendor.id} is not in the preferred network for ${state}.`);
  if (vendor.type !== body.role) throw notEligible(`Vendor ${vendor.id} is a ${vendor.type} vendor and cannot perform ${body.role} work.`);
  if (postal && !vendor.service_area.includes(postal)) throw notEligible(`Vendor ${vendor.id} does not serve postal code ${postal}.`);

  const row = await tx((db) => createEngagement(db, claim, vendor, { type: body.role, scheduledFor: body.scheduledFor, instructions: body.instructions }, who, 'assignment'));
  return c.json(toAssignment(row), 201);
});

claimsApi.get('/claims/:claimId/timeline', async (c) => {
  const claim = await mustClaim(c.req.param('claimId'));
  const rows = await query(`SELECT * FROM claim_events WHERE claim_id = $1 ORDER BY at, id`, [claim.id]);
  return c.json({ data: rows.map(toEvent) });
});
