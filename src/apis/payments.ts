import { Hono } from 'hono';
import { createHash } from 'node:crypto';
import { query, one, nextId, tx, pool } from '../db';
import {
  ApiError, badRequest, compact, conflict, fmtUsd, forbidden, idempotent, iso, money, notFound, opt, pageOf, parsePage, principal, readJson,
  recordEvent, requireScope, round2, SCOPES, unprocessable, validBody, type FieldError,
} from '../lib/http';
import { claimBalance, settleAfter, settleDue } from '../lib/domain';
import { requestBodyValidator, formatAjvErrors } from '../lib/openapi';

const API = 'payments';
const ID_RE = /^pay_[0-9]+$/;
const STATUSES = ['pending_approval', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];

/** Payments above these amounts are held in pending_approval for a second approver. */
export const APPROVAL_THRESHOLD = { customer: 10_000, vendor: 25_000 } as const;

const PAYEE_TYPES_FOR: Record<string, string[]> = {
  settlement: ['customer'],
  vendor_invoice: ['vendor'],
  rental_reimbursement: ['customer', 'vendor'],
  premium_refund: ['customer'],
};

export const toPayment = (r: any) =>
  compact({
    id: r.id,
    claimId: r.claim_id,
    type: r.type,
    payee: { type: r.payee_type, id: r.payee_id },
    paymentMethodId: opt(r.payment_method_id),
    amount: money(r.amount, r.currency)!,
    status: r.status,
    method: opt(r.method),
    invoiceNumber: opt(r.invoice_number),
    memo: opt(r.memo),
    createdAt: iso(r.created_at)!,
    completedAt: iso(r.completed_at),
  });

export const toRefund = (r: any) =>
  ({ id: r.id, paymentId: r.payment_id, amount: money(r.amount, r.currency)!, reason: r.reason, status: r.status, createdAt: iso(r.created_at)! });

export const toPaymentMethod = (r: any) =>
  compact({ id: r.id, payeeId: r.payee_id, type: r.type, label: opt(r.label), last4: r.last4, bankName: opt(r.bank_name), isDefault: r.is_default });

async function mustPayment(id: string) {
  const p = ID_RE.test(id) ? await one(`SELECT * FROM payments WHERE id = $1`, [id]) : undefined;
  if (!p) throw notFound(`No payment exists with ID ${id}.`, 'Payment not found');
  return p;
}

function checkMoney(field: string, m: { amount: number; currency: string }, currency = 'USD'): FieldError[] {
  const errors: FieldError[] = [];
  if (!(m.amount > 0)) errors.push({ field: `${field}.amount`, message: 'must be greater than 0' });
  else if (Math.abs(round2(m.amount) - m.amount) > 1e-9) errors.push({ field: `${field}.amount`, message: 'must have at most 2 decimal places' });
  if (m.currency !== currency) errors.push({ field: `${field}.currency`, message: `must be ${currency}` });
  return errors;
}

async function payeeExists(id: string): Promise<'customer' | 'vendor' | undefined> {
  if (id.startsWith('cus_') && (await one(`SELECT 1 FROM customers WHERE id = $1`, [id]))) return 'customer';
  if (id.startsWith('ven_') && (await one(`SELECT 1 FROM vendors WHERE id = $1`, [id]))) return 'vendor';
  return undefined;
}

export const paymentsApi = new Hono();

paymentsApi.use('*', async (_c, next) => {
  await settleDue();
  await next();
});

paymentsApi.get('/payments', async (c) => {
  const page = parsePage(c, false);
  const { claimId, payeeId, status } = c.req.query();
  const where: string[] = [];
  const params: unknown[] = [];
  if (claimId) where.push(`claim_id = $${params.push(claimId)}`);
  if (payeeId) where.push(`payee_id = $${params.push(payeeId)}`);
  if (status) where.push(STATUSES.includes(status) ? `status = $${params.push(status)}` : 'false');
  const rows = await query(
    `SELECT * FROM payments ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC, id DESC LIMIT ${page.limit + 1} OFFSET ${page.offset}`,
    params,
  );
  return c.json(pageOf(rows.map(toPayment), page));
});

paymentsApi.post('/payments', async (c) => {
  requireScope(c, SCOPES.PAYMENTS_WRITE);
  const body = await validBody(c, API, 'createPayment');
  const who = principal(c);
  return idempotent(c, { scope: 'createPayment', required: true, body, mismatchStatus: 409 }, async () => {
    const errors = checkMoney('amount', body.amount);
    if (body.type === 'vendor_invoice' && !body.invoiceNumber) errors.push({ field: 'invoiceNumber', message: 'is required for vendor_invoice payments' });
    if (errors.length) throw badRequest('Request body failed validation.', errors);

    const claim = await one(`SELECT * FROM claims WHERE id = $1`, [body.claimId]);
    if (!claim) throw unprocessable('claim-not-found', 'Claim not found', `No claim exists with ID ${body.claimId}.`);
    if (claim.status !== 'approved') {
      throw unprocessable('claim-not-approved', 'Claim not approved', `Claim ${claim.id} is ${claim.status}; payments can only be issued for approved claims.`);
    }
    if (!PAYEE_TYPES_FOR[body.type].includes(body.payee.type)) {
      throw unprocessable('invalid-payee', 'Invalid payee for payment type', `${body.type} payments must be paid to a ${PAYEE_TYPES_FOR[body.type].join(' or ')}.`);
    }
    if (body.payee.type === 'customer' && body.payee.id !== claim.customer_id) {
      throw unprocessable('payee-not-on-claim', 'Payee not on claim', `Customer ${body.payee.id} is not the claimant on ${claim.id} (${claim.customer_id}).`);
    }
    if (body.payee.type === 'vendor') {
      const engaged = await one(`SELECT 1 FROM work_orders WHERE claim_id = $1 AND vendor_id = $2 AND status NOT IN ('declined', 'cancelled')`, [claim.id, body.payee.id]);
      if (!engaged) throw unprocessable('payee-not-on-claim', 'Payee not on claim', `Vendor ${body.payee.id} has no active work order on claim ${claim.id}.`);
    }
    const pm = await one(`SELECT * FROM payment_methods WHERE id = $1`, [body.paymentMethodId]);
    if (!pm || pm.payee_id !== body.payee.id) {
      throw unprocessable('invalid-payment-method', 'Invalid payment method', `Payment method ${body.paymentMethodId} does not belong to payee ${body.payee.id}.`);
    }
    if (body.invoiceNumber && body.payee.type === 'vendor') {
      const dupInvoice = await one(
        `SELECT id FROM payments WHERE payee_id = $1 AND invoice_number = $2 AND status NOT IN ('cancelled', 'failed')`,
        [body.payee.id, body.invoiceNumber],
      );
      if (dupInvoice) throw conflict(`Invoice ${body.invoiceNumber} from ${body.payee.id} was already paid (${dupInvoice.id}).`, 'Duplicate invoice', 'duplicate-invoice');
    }
    if (body.type !== 'premium_refund') {
      const bal = await claimBalance(pool, claim);
      if (body.amount.amount > bal.remaining + 1e-9) {
        throw unprocessable(
          'exceeds-approved-amount',
          'Amount exceeds approved balance',
          `Requested ${fmtUsd(body.amount.amount)} but only ${fmtUsd(Math.max(0, bal.remaining))} remains approved for claim ${claim.id}.`,
        );
      }
    }

    const needsApproval = body.amount.amount > APPROVAL_THRESHOLD[body.payee.type as 'customer' | 'vendor'];
    const status = needsApproval ? 'pending_approval' : 'processing';
    const method = pm.type === 'debit_card' ? 'card' : 'ach';
    const row = await tx(async (db) => {
      const id = `pay_${await nextId('payment_seq', db)}`;
      const r = await one(
        `INSERT INTO payments (id, claim_id, type, payee_type, payee_id, payment_method_id, amount, currency, status, method, invoice_number, memo,
           created_by, settle_after, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now(), now()) RETURNING *`,
        [id, claim.id, body.type, body.payee.type, body.payee.id, pm.id, body.amount.amount, body.amount.currency, status, method,
          body.invoiceNumber ?? null, body.memo ?? null, who.sub, needsApproval ? null : settleAfter()],
        db,
      );
      await recordEvent(db, claim.id, 'payment.created',
        `Payment ${id} of ${fmtUsd(r.amount)} (${body.type}) to ${body.payee.type} ${body.payee.id} created${needsApproval ? '; held for approval' : ''}.`, who, r.created_at);
      return r;
    });
    return { status: 201, body: toPayment(row), headers: { Location: `/payments/${row.id}` } };
  });
});

paymentsApi.get('/payments/:paymentId', async (c) => c.json(toPayment(await mustPayment(c.req.param('paymentId')))));

paymentsApi.post('/payments/:paymentId/approve', async (c) => {
  requireScope(c, SCOPES.PAYMENTS_APPROVE);
  const p = await mustPayment(c.req.param('paymentId'));
  const body: any = (await readJson(c, false)) ?? {};
  if (typeof body !== 'object' || (body.comment !== undefined && typeof body.comment !== 'string')) {
    throw new ApiError(400, 'validation-error', 'Validation failed', 'comment must be a string.');
  }
  const who = principal(c);
  if (p.status !== 'pending_approval') throw conflict(`Payment ${p.id} is ${p.status} and is not awaiting approval.`);
  if (p.created_by === who.sub) throw forbidden('The approver must differ from the user who created the payment.');
  const row = await tx(async (db) => {
    const r = await one(
      `UPDATE payments SET status = 'processing', approved_by = $2, approval_comment = $3, settle_after = $4, updated_at = now() WHERE id = $1 RETURNING *`,
      [p.id, who.sub, body.comment ?? null, settleAfter()],
      db,
    );
    await recordEvent(db, p.claim_id, 'payment.approved', `Payment ${p.id} of ${fmtUsd(p.amount)} approved by ${who.sub}${body.comment ? `: ${body.comment}` : '.'}`, who);
    return r;
  });
  return c.json(toPayment(row));
});

paymentsApi.post('/payments/:paymentId/cancel', async (c) => {
  const p = await mustPayment(c.req.param('paymentId'));
  const body: any = await readJson(c, true);
  const validate = requestBodyValidator(API, 'cancelPayment');
  const data: unknown = body;
  if (!validate(data)) throw badRequest('Request body failed validation.', formatAjvErrors(validate.errors));
  const who = principal(c);
  if (!['pending_approval', 'processing'].includes(p.status)) {
    throw conflict(`Payment ${p.id} is ${p.status}; only pending_approval or processing payments can be cancelled.`);
  }
  const row = await tx(async (db) => {
    const r = await one(
      `UPDATE payments SET status = 'cancelled', cancel_reason = $2, cancel_comment = $3, settle_after = NULL, updated_at = now() WHERE id = $1 RETURNING *`,
      [p.id, body.reason, body.comment ?? null],
      db,
    );
    await recordEvent(db, p.claim_id, 'payment.cancelled', `Payment ${p.id} of ${fmtUsd(p.amount)} cancelled (${body.reason})${body.comment ? `: ${body.comment}` : '.'}`, who);
    return r;
  });
  return c.json(toPayment(row));
});

paymentsApi.get('/payments/:paymentId/refunds', async (c) => {
  const p = await mustPayment(c.req.param('paymentId'));
  const rows = await query(`SELECT * FROM refunds WHERE payment_id = $1 ORDER BY created_at, id`, [p.id]);
  return c.json({ data: rows.map(toRefund) });
});

paymentsApi.post('/payments/:paymentId/refunds', async (c) => {
  const p = await mustPayment(c.req.param('paymentId'));
  const body = await validBody(c, API, 'createPaymentRefund');
  const who = principal(c);
  return idempotent(c, { scope: `createPaymentRefund:${p.id}`, required: true, body, mismatchStatus: 400 }, async () => {
    const errors = checkMoney('amount', body.amount, p.currency.trim());
    if (errors.length) throw badRequest('Request body failed validation.', errors);
    if (p.status !== 'completed') {
      throw unprocessable('payment-not-refundable', 'Payment not refundable', `Only completed payments can be refunded; ${p.id} is ${p.status}.`);
    }
    const refunded = (await one(`SELECT COALESCE(SUM(amount), 0) AS total FROM refunds WHERE payment_id = $1 AND status <> 'failed'`, [p.id])).total;
    const refundable = round2(p.amount - refunded);
    if (body.amount.amount > refundable + 1e-9) {
      throw unprocessable('exceeds-refundable-balance', 'Refund exceeds balance', `Refundable balance on ${p.id} is ${fmtUsd(refundable)}.`);
    }
    const row = await tx(async (db) => {
      const id = `ref_${await nextId('refund_seq', db)}`;
      const r = await one(
        `INSERT INTO refunds (id, payment_id, amount, currency, reason, status, created_by, settle_after, created_at)
         VALUES ($1, $2, $3, $4, $5, 'processing', $6, $7, now()) RETURNING *`,
        [id, p.id, body.amount.amount, body.amount.currency, body.reason, who.sub, settleAfter()],
        db,
      );
      await recordEvent(db, p.claim_id, 'refund.created', `Refund ${id} of ${fmtUsd(r.amount)} (${body.reason}) requested on payment ${p.id}.`, who, r.created_at);
      return r;
    });
    return { status: 201, body: toRefund(row) };
  });
});

paymentsApi.get('/payment-methods', async (c) => {
  const payeeId = c.req.query('payeeId');
  if (!payeeId) throw badRequest('The payeeId query parameter is required.', [{ field: 'payeeId', message: 'is required' }]);
  if (!(await payeeExists(payeeId))) throw badRequest('Invalid query parameter.', [{ field: 'payeeId', message: `no customer or vendor exists with ID ${payeeId}` }]);
  const rows = await query(`SELECT * FROM payment_methods WHERE payee_id = $1 ORDER BY is_default DESC, created_at, id`, [payeeId]);
  return c.json({ data: rows.map(toPaymentMethod) });
});

const BANKS = ['First Example Bank', 'Piedmont Federal Credit Union', 'Palmetto Savings Bank', 'Volunteer State Bank', 'First Coast Credit Union'];

paymentsApi.post('/payment-methods', async (c) => {
  const body = await validBody(c, API, 'createPaymentMethod');
  const payeeType = await payeeExists(body.payeeId);
  const errors: FieldError[] = [];
  if (!payeeType) errors.push({ field: 'payeeId', message: `no customer or vendor exists with ID ${body.payeeId}` });
  const prefix = body.type === 'bank_account' ? 'tok_bank_' : 'tok_card_';
  if (!body.token.startsWith(prefix) || body.token.length < prefix.length + 8) {
    errors.push({ field: 'token', message: `must be a single-use ${body.type} token from the hosted payment form (${prefix}...)` });
  }
  const tokenHash = createHash('sha256').update(body.token).digest('hex');
  if (await one(`SELECT 1 FROM payment_methods WHERE token_hash = $1`, [tokenHash])) errors.push({ field: 'token', message: 'has already been used' });
  if (errors.length) throw badRequest('Request body failed validation.', errors);

  // The hosted form tokenizes the account; we only ever learn the last four digits and the bank.
  const n = parseInt(tokenHash.slice(0, 8), 16);
  const last4 = String(n % 10000).padStart(4, '0');
  const bankName = BANKS[n % BANKS.length];
  const label = body.type === 'bank_account'
    ? `${payeeType === 'vendor' ? 'Business checking' : 'Checking'} ending in ${last4}`
    : `Visa debit ending in ${last4}`;
  const row = await tx(async (db) => {
    const existing = await one(`SELECT count(*)::int AS n FROM payment_methods WHERE payee_id = $1`, [body.payeeId], db);
    const isDefault = body.isDefault === true || existing.n === 0;
    if (isDefault) await query(`UPDATE payment_methods SET is_default = false WHERE payee_id = $1`, [body.payeeId], db);
    const id = `pm_${await nextId('payment_method_seq', db)}`;
    return one(
      `INSERT INTO payment_methods (id, payee_type, payee_id, type, label, last4, bank_name, is_default, token_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now()) RETURNING *`,
      [id, payeeType, body.payeeId, body.type, label, last4, bankName, isDefault, tokenHash],
      db,
    );
  });
  return c.json(toPaymentMethod(row), 201);
});
