/** Adjuster and supervisor tools: work the queue, review, decide, dispatch, pay, and close out. */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { defineTool, ToolError } from '../lib/kit';
import { getAccessibleClaim } from '../lib/access';
import { api, get, getAll, tryGet } from '../lib/upstream';
import { assignmentView, balanceOf, fetchBundle, lastActivity, riskFor, statusView, type Bundle } from '../lib/claims';
import { ADJUSTER_APPROVAL_LIMIT, PAYMENT_APPROVAL_THRESHOLD } from '../lib/config';
import { ageDays, money, round2, usd } from '../lib/format';

const STAFF = ['adjuster', 'supervisor'] as const;
const claimId = z.string().regex(/^clm_[0-9]{4}-[0-9]{6}$/).describe('Claim ID, e.g. clm_2026-000417');
const amountSchema = z.number().positive().describe('Amount in USD');

const needStatus = (claim: any, ...ok: string[]) => {
  if (!ok.includes(claim.status)) throw new ToolError(`Claim ${claim.id} is ${claim.status}; this action needs ${ok.join(' or ')}.`);
};

/** Records the reasoning behind an action on the claim, the way an adjuster would in the file. */
const internalNote = (p: any, id: string, body: string) => api(p, 'POST', `/claims/v1/claims/${id}/notes`, { body: { body, visibility: 'internal' } });
const customerNote = (p: any, id: string, body: string) => api(p, 'POST', `/claims/v1/claims/${id}/notes`, { body: { body, visibility: 'customer' } });

async function escalate(p: any, claim: any, why: string) {
  await internalNote(p, claim.id, `[ESCALATION to supervisor] ${why} Raised by ${p.sub}.`);
}

export const claimsWorklist = defineTool({
  name: 'claims_worklist',
  title: 'Claims worklist',
  description:
    'Your prioritised queue. Pulls submitted, under-review, and approved claims and ranks them by urgency: injuries, undrivable vehicles, unassigned intake, age, stalled activity, and approved claims with money still to pay. Each row says why it ranks where it does and what to do next.',
  roles: [...STAFF],
  input: {
    mine: z.boolean().default(false).describe('Only claims assigned to you (plus unassigned intake)'),
    includeStatuses: z.array(z.enum(['submitted', 'under_review', 'approved'])).default(['submitted', 'under_review', 'approved']),
    limit: z.number().int().min(1).max(50).default(15),
  },
  readOnly: true,
  handler: async (a, p) => {
    const lists = await Promise.all(a.includeStatuses.map((s: string) => getAll(p, '/claims/v1/claims', { status: s }, 3)));
    let claims = lists.flat();
    if (a.mine) claims = claims.filter((c) => !c.assignedAdjusterId || c.assignedAdjusterId === p.sub);
    const approved = claims.filter((c) => c.status === 'approved').slice(0, 25);
    const unpaid = new Map<string, { remaining: number; inFlight: boolean }>();
    await Promise.all(
      approved.map(async (c) => {
        const pays = await getAll(p, '/payments/v1/payments', { claimId: c.id });
        const refunds: Record<string, any[]> = {};
        await Promise.all(pays.filter((x) => ['completed', 'refunded'].includes(x.status)).map(async (x) => (refunds[x.id] = (await get(p, `/payments/v1/payments/${x.id}/refunds`)).data)));
        unpaid.set(c.id, { remaining: balanceOf(c, pays, refunds).remaining, inFlight: pays.some((x) => ['pending_approval', 'processing'].includes(x.status)) });
      }),
    );
    const rows = claims.map((c) => {
      const why: string[] = [];
      let score = 0;
      const add = (pts: number, reason: string) => ((score += pts), why.push(reason));
      if (c.injuries) add(30, 'injuries reported');
      if (c.drivable === false) add(10, 'vehicle not drivable');
      if (c.status === 'submitted' && !c.assignedAdjusterId) add(15, 'unassigned intake');
      const age = ageDays(c.createdAt);
      if (age) add(Math.min(30, age * 2), `${age} days old`);
      const idle = ageDays(c.updatedAt);
      if (idle >= 5) add(10, `no activity for ${idle} days`);
      if (c.status === 'under_review' && !c.estimatedAmount) add(5, 'no estimate yet');
      const u = unpaid.get(c.id);
      if (u && u.remaining > 0 && !u.inFlight) add(15, `${usd(u.remaining)} approved but not yet paid`);
      if (c.status === 'under_review' && c.estimatedAmount && c.estimatedAmount.amount - (c.deductible?.amount ?? 0) > ADJUSTER_APPROVAL_LIMIT) add(0, 'needs supervisor approval (over authority limit)');
      const next =
        c.status === 'submitted' ? 'start_claim_review'
          : c.status === 'under_review' ? (c.estimatedAmount ? 'assess_claim_risk then decide_claim' : 'set_estimate')
            : u?.remaining ? 'issue_payment' : 'monitor payments';
      return { claimId: c.id, status: c.status, type: c.type, customerId: c.customerId, assignedAdjusterId: c.assignedAdjusterId ?? null, priority: score, why, next };
    });
    rows.sort((x, y) => y.priority - x.priority);
    return {
      forRole: p.role,
      totalOpen: rows.length,
      showing: Math.min(a.limit, rows.length),
      byStatus: Object.fromEntries(a.includeStatuses.map((s: string) => [s, rows.filter((r) => r.status === s).length])),
      queue: rows.slice(0, a.limit),
    };
  },
});

export const claimDossier = defineTool({
  name: 'claim_dossier',
  title: 'Claim dossier',
  description:
    'The full 360 on a claim for staff: claim, customer (PII only with your scope), policy and coverages, vehicle, internal and customer notes, timeline, vendor jobs and work orders, payments and balance, the risk screen, and your authority for the next step. Start here before deciding anything.',
  roles: [...STAFF],
  input: { claimId },
  readOnly: true,
  handler: async ({ claimId: id }, p) => {
    const claim = await getAccessibleClaim(p, id);
    const [b, workOrders] = await Promise.all([fetchBundle(p, claim), getAll(p, '/vendors/v1/work-orders', { claimId: id })]);
    const [risk, coverages, vehicle] = await Promise.all([
      riskFor(p, b),
      tryGet(p, `/policies/v1/policies/${claim.policyId}/coverages`),
      claim.vehicleId ? tryGet(p, `/customers/v1/customers/${claim.customerId}/vehicles`) : undefined,
    ]);
    const cust = b.customer;
    const view = statusView(p, b);
    const approvedAmount = view.money.approvedAmount.amount;
    return {
      ...view,
      customer: cust && {
        id: cust.id,
        name: `${cust.firstName} ${cust.lastName}`,
        status: cust.status,
        email: cust.email,
        phone: cust.phone,
        dateOfBirth: cust.dateOfBirth,
        contactPreference: cust.preferences?.contactMethod,
        city: `${cust.address?.city}, ${cust.address?.state}`,
        piiVisible: p.scopes.includes('customers:pii:read'),
      },
      policy: b.policy && { id: b.policy.id, product: b.policy.product, status: b.policy.status, term: `${b.policy.effectiveDate} to ${b.policy.expirationDate}`, coverages: coverages?.data },
      vehicle: (vehicle?.data as any[] | undefined)?.find((v) => v.id === claim.vehicleId),
      workOrders: workOrders.map((w) => ({ id: w.id, vendorId: w.vendorId, type: w.type, status: w.status, estimate: w.estimate ?? null, scheduledFor: w.scheduledFor })),
      risk,
      authority: {
        yourRole: p.role,
        adjusterApprovalLimit: usd(ADJUSTER_APPROVAL_LIMIT),
        approvedAmountIfApproved: usd(approvedAmount),
        youCanApprove: p.role === 'supervisor' || approvedAmount <= ADJUSTER_APPROVAL_LIMIT,
        paymentApprovalThresholds: PAYMENT_APPROVAL_THRESHOLD,
      },
      allNotes: b.notes,
      fullTimeline: b.timeline,
    };
  },
});

export const assessClaimRisk = defineTool({
  name: 'assess_claim_risk',
  title: 'Assess claim risk',
  description:
    'Runs the transparent risk screen on a claim: customer standing, coverage re-verification, reporting delay, early-in-term loss, claim frequency, repeat losses on the same vehicle, missing police reports, and amounts over limits or authority. Returns a score, level, every flag with its reason, and the recommended handling.',
  roles: [...STAFF],
  input: { claimId, recordInFile: z.boolean().default(false).describe('Also write the result to the claim as an internal note') },
  readOnly: false,
  idempotent: false,
  handler: async ({ claimId: id, recordInFile }, p) => {
    const b = await fetchBundle(p, await getAccessibleClaim(p, id));
    const risk = await riskFor(p, b);
    if (recordInFile) await internalNote(p, id, `Risk screen: ${risk.level.toUpperCase()} (score ${risk.score}). ${risk.flags.map((f) => f.message).join(' ') || 'No flags.'} Recommendation: ${risk.recommendation}`);
    return { claimId: id, ...risk, recordedInFile: recordInFile };
  },
});

export const startClaimReview = defineTool({
  name: 'start_claim_review',
  title: 'Start claim review',
  description:
    'Takes a submitted claim into review: assigns an adjuster (you by default), optionally sets the first estimate, moves it to under_review, runs the risk screen, and records an auto-triage note in the file. Supervisors may assign another adjuster.',
  roles: [...STAFF],
  input: {
    claimId,
    adjusterId: z.string().optional().describe('Defaults to you. Only supervisors may assign someone else.'),
    estimate: amountSchema.optional().describe('Initial repair estimate, if you already have one'),
  },
  handler: async (a, p) => {
    const claim = await getAccessibleClaim(p, a.claimId);
    needStatus(claim, 'submitted');
    const adjuster = a.adjusterId ?? p.sub;
    if (adjuster !== p.sub && p.role !== 'supervisor') throw new ToolError('Only a supervisor can assign a claim to another adjuster.');
    const updated = await api(p, 'PATCH', `/claims/v1/claims/${claim.id}`, {
      body: { status: 'under_review', assignedAdjusterId: adjuster, ...(a.estimate ? { estimatedAmount: money(a.estimate) } : {}) },
    });
    const b = await fetchBundle(p, updated);
    const risk = await riskFor(p, b);
    await internalNote(p, claim.id, `Review started by ${p.sub}; assigned to ${adjuster}. Auto-triage: risk ${risk.level.toUpperCase()} (score ${risk.score}). ${risk.flags.map((f) => f.message).join(' ') || 'No flags.'}`);
    await customerNote(p, claim.id, `Your claim is now being reviewed by an adjuster (${adjuster}). We'll contact you if we need anything else.`);
    return { claimId: claim.id, status: updated.status, assignedAdjusterId: adjuster, estimate: updated.estimatedAmount ?? null, risk, nextSteps: statusView(p, b).nextSteps };
  },
});

export const setEstimate = defineTool({
  name: 'set_estimate',
  title: 'Set repair estimate',
  description: 'Sets or revises the repair estimate on a claim that is still being reviewed. Shows the resulting approved amount (estimate minus deductible) and whether it exceeds adjuster authority.',
  roles: [...STAFF],
  input: { claimId, estimate: amountSchema, basis: z.string().max(500).optional().describe('Where the number came from, e.g. "Bayview Collision estimate #4411"') },
  handler: async ({ claimId: id, estimate, basis }, p) => {
    const claim = await getAccessibleClaim(p, id);
    needStatus(claim, 'submitted', 'under_review');
    const updated = await api(p, 'PATCH', `/claims/v1/claims/${id}`, { body: { estimatedAmount: money(estimate) } });
    const approved = Math.max(0, round2(estimate - (updated.deductible?.amount ?? 0)));
    if (basis) await internalNote(p, id, `Estimate set to ${usd(estimate)} by ${p.sub}. Basis: ${basis}`);
    return {
      claimId: id,
      estimate: updated.estimatedAmount,
      deductible: updated.deductible,
      approvedAmount: money(approved),
      withinYourAuthority: p.role === 'supervisor' || approved <= ADJUSTER_APPROVAL_LIMIT,
      note: p.role !== 'supervisor' && approved > ADJUSTER_APPROVAL_LIMIT ? `Above your ${usd(ADJUSTER_APPROVAL_LIMIT)} limit: a supervisor will need to approve.` : undefined,
    };
  },
});

export const decideClaim = defineTool({
  name: 'decide_claim',
  title: 'Approve or deny a claim',
  description:
    'Makes the coverage decision on a claim under review. APPROVE: approved amount = estimate - deductible. Enforces authority: above the adjuster limit, or when the risk screen is HIGH, an adjuster is blocked and the claim is escalated with a note; a supervisor can proceed (a high-risk claim needs a documented overrideReason). DENY: requires an explanation that is sent to the customer. Both write the reasoning to the file. Use confirm=false to preview.',
  roles: [...STAFF],
  input: {
    claimId,
    decision: z.enum(['approve', 'deny']),
    rationale: z.string().min(10).max(1000).describe('Internal reasoning for the file'),
    estimate: amountSchema.optional().describe('Set or change the estimate as part of approving'),
    customerExplanation: z.string().min(20).max(1500).optional().describe('Required for deny: plain-language reason sent to the customer. Do not mention fraud screening.'),
    overrideReason: z.string().min(15).max(1000).optional().describe('Supervisor only: why a HIGH-risk claim should proceed anyway'),
    confirm: z.boolean().default(false),
  },
  destructive: true,
  handler: async (a, p) => {
    const claim = await getAccessibleClaim(p, a.claimId);
    if (claim.status === 'submitted') throw new ToolError(`Claim ${claim.id} has not been reviewed yet.`, 'Run start_claim_review first.');
    needStatus(claim, 'under_review');
    if (a.decision === 'deny') {
      if (!a.customerExplanation) throw new ToolError('A denial needs customerExplanation: the customer is entitled to a reason.');
      if (!a.confirm) return { decided: false, confirmationRequired: true, willDo: `Deny ${claim.id}, cancel its open vendor jobs, and send the customer your explanation.`, customerWillSee: a.customerExplanation };
      const done = await api(p, 'PATCH', `/claims/v1/claims/${claim.id}`, { body: { status: 'denied' } });
      await internalNote(p, claim.id, `DENIED by ${p.sub}: ${a.rationale}`);
      await customerNote(p, claim.id, `Decision on your claim: not approved. ${a.customerExplanation} If you have new information, reply to this note and a supervisor will review it.`);
      return { decided: true, claimId: claim.id, status: done.status, message: 'Denied. Open vendor jobs were cancelled and the customer was notified.' };
    }

    const estimate = a.estimate ?? claim.estimatedAmount?.amount;
    if (estimate === undefined) throw new ToolError('Set an estimate before approving.', 'Pass estimate here or use set_estimate.');
    const approved = Math.max(0, round2(estimate - (claim.deductible?.amount ?? 0)));
    const b = await fetchBundle(p, { ...claim, estimatedAmount: money(estimate) });
    const risk = await riskFor(p, b);
    const summary = { estimate: usd(estimate), deductible: usd(claim.deductible?.amount ?? 0), approvedAmount: usd(approved), risk: { level: risk.level, score: risk.score, flags: risk.flags.map((f) => f.message) } };

    if (approved > ADJUSTER_APPROVAL_LIMIT && p.role !== 'supervisor') {
      await escalate(p, claim, `Approval of ${usd(approved)} exceeds the ${usd(ADJUSTER_APPROVAL_LIMIT)} adjuster authority. Rationale: ${a.rationale}`);
      return { decided: false, escalated: true, reason: 'authority_limit', ...summary, message: `Approving ${usd(approved)} needs a supervisor. An escalation note was added to the file.` };
    }
    if (risk.level === 'high') {
      if (p.role !== 'supervisor') {
        await escalate(p, claim, `High-risk claim (score ${risk.score}): ${risk.flags.map((f) => f.message).join(' ')}`);
        return { decided: false, escalated: true, reason: 'high_risk', ...summary, message: 'The risk screen is HIGH, so only a supervisor can approve. An escalation note was added to the file.' };
      }
      if (!a.overrideReason) {
        return { decided: false, needsOverride: true, reason: 'high_risk', ...summary, message: 'The risk screen is HIGH. To approve anyway, call again with overrideReason explaining why it is safe to proceed; it is recorded in the file.' };
      }
    }
    if (!a.confirm) return { decided: false, confirmationRequired: true, willApprove: summary, message: 'Call again with confirm=true to approve.' };

    const done = await api(p, 'PATCH', `/claims/v1/claims/${claim.id}`, { body: { status: 'approved', ...(a.estimate ? { estimatedAmount: money(a.estimate) } : {}) } });
    const overridden = risk.level === 'high';
    await internalNote(p, claim.id, `APPROVED by ${p.sub} (${p.role}) for ${usd(approved)}. Rationale: ${a.rationale}${overridden ? ` SUPERVISOR OVERRIDE of HIGH risk screen: ${a.overrideReason}` : ''}`);
    await customerNote(p, claim.id, `Good news: your claim is approved. The approved amount is ${usd(approved)} (estimate ${usd(estimate)} minus your ${usd(claim.deductible?.amount ?? 0)} deductible). We'll now arrange payment.`);
    return { decided: true, claimId: claim.id, status: done.status, ...summary, overrideRecorded: overridden, nextSteps: ['issue_payment to pay the customer or settle with vendors', 'request_service for any outstanding repair/rental work'] };
  },
});

async function defaultMethod(p: any, payeeId: string) {
  const methods = (await get(p, '/payments/v1/payment-methods', { payeeId })).data as any[];
  return methods.find((m) => m.isDefault) ?? methods[0];
}

export const issuePayment = defineTool({
  name: 'issue_payment',
  title: 'Issue a claim payment',
  description:
    'Pays the customer (settlement) or a vendor (invoice) on an approved claim. Defaults the amount to the remaining approved balance (or the vendor\'s work-order estimate), picks the payee\'s default payout method, blocks overpayment, duplicate invoices and look-alike duplicate payments, and shows whether it will wait for supervisor approval. Money moves only with confirm=true. The risk screen can hold payment on high-risk claims.',
  roles: [...STAFF],
  input: {
    claimId,
    payee: z.enum(['customer', 'vendor']).default('customer'),
    vendorId: z.string().optional().describe('Required when payee is vendor'),
    amount: amountSchema.optional(),
    invoiceNumber: z.string().optional().describe('Required for vendor payments'),
    memo: z.string().max(255).optional(),
    overrideReason: z.string().min(15).max(1000).optional().describe('Supervisor only: proceed on a HIGH-risk claim'),
    allowDuplicate: z.boolean().default(false).describe('Pay again even though an identical payment was just made'),
    requestId: z.string().optional().describe('Reuse the same value when retrying so the payment is never created twice'),
    confirm: z.boolean().default(false),
  },
  destructive: true,
  idempotent: true,
  handler: async (a, p) => {
    const claim = await getAccessibleClaim(p, a.claimId);
    needStatus(claim, 'approved');
    const b = await fetchBundle(p, claim);
    const bal = balanceOf(claim, b.payments, b.refunds);
    const payeeId = a.payee === 'customer' ? claim.customerId : a.vendorId;
    if (!payeeId) throw new ToolError('vendorId is required to pay a vendor.');
    if (a.payee === 'vendor' && !a.invoiceNumber) throw new ToolError('invoiceNumber is required for vendor payments.');
    if (a.payee === 'vendor' && !b.assignments.some((x) => x.vendorId === payeeId && !['declined', 'cancelled'].includes(x.status))) {
      throw new ToolError(`Vendor ${payeeId} has no active assignment on ${claim.id}.`, 'Only vendors working the claim can be paid.');
    }
    let amount = a.amount;
    if (amount === undefined) {
      if (a.payee === 'customer') amount = bal.remaining;
      else amount = (await getAll(p, '/vendors/v1/work-orders', { claimId: claim.id, vendorId: payeeId })).find((w) => w.estimate)?.estimate?.amount;
    }
    if (!amount || amount <= 0) throw new ToolError(a.payee === 'customer' ? 'Nothing left to pay on this claim.' : 'No amount given and the vendor has no estimate on file; pass amount.');
    if (amount > bal.remaining + 0.004) throw new ToolError(`Requested ${usd(amount)} but only ${usd(Math.max(0, bal.remaining))} remains of the approved ${usd(bal.approved)}.`, 'Omit amount to pay the remaining balance.');

    const dup = b.payments.find(
      (x) => x.payee.id === payeeId && x.amount.amount === amount && !['cancelled', 'failed'].includes(x.status) && Date.now() - Date.parse(x.createdAt) < 10 * 60_000,
    );
    if (dup && !a.allowDuplicate) throw new ToolError(`An identical ${usd(amount)} payment to ${payeeId} was created minutes ago (${dup.id}, ${dup.status}).`, 'If this is a retry, it already went through. Set allowDuplicate=true only if a second payment is intended.');

    const method = await defaultMethod(p, payeeId);
    if (!method) throw new ToolError(`${payeeId} has no payout method on file.`, a.payee === 'customer' ? 'Ask the customer to add one (add_payout_method).' : 'Add one with add_payout_method(payeeId=...).');

    const risk = await riskFor(p, b);
    if (risk.level === 'high') {
      if (p.role !== 'supervisor') {
        await escalate(p, claim, `Payment of ${usd(amount)} held: HIGH risk (score ${risk.score}).`);
        return { paid: false, escalated: true, reason: 'high_risk', flags: risk.flags.map((f) => f.message), message: 'This claim is high-risk, so payments need a supervisor. An escalation note was added.' };
      }
      if (!a.overrideReason) return { paid: false, needsOverride: true, reason: 'high_risk', flags: risk.flags.map((f) => f.message), message: 'High-risk claim: call again with overrideReason to proceed. It is recorded in the file.' };
    }

    const threshold = PAYMENT_APPROVAL_THRESHOLD[a.payee as 'customer' | 'vendor'];
    const needsApproval = amount > threshold;
    const preview = {
      claimId: claim.id,
      payee: { type: a.payee, id: payeeId },
      amount: money(amount),
      method: `${method.label}${method.isDefault ? ' (default)' : ''}`,
      type: a.payee === 'customer' ? 'settlement' : 'vendor_invoice',
      remainingAfter: money(round2(bal.remaining - amount)),
      willSettleClaim: round2(bal.remaining - amount) <= 0.004,
      approvalRequired: needsApproval ? `Over ${usd(threshold)}: will wait in pending_approval for a supervisor other than ${p.sub}.` : false,
      warning: needsApproval && p.role === 'supervisor' ? 'You are a supervisor creating this payment, so you cannot approve it yourself; another supervisor must.' : undefined,
    };
    if (!a.confirm) return { paid: false, confirmationRequired: true, preview, message: 'Call again with confirm=true to issue the payment.' };

    const pay = await api(p, 'POST', '/payments/v1/payments', {
      idempotencyKey: a.requestId ?? randomUUID(),
      body: {
        claimId: claim.id,
        type: preview.type,
        payee: preview.payee,
        paymentMethodId: method.id,
        amount: money(amount),
        ...(a.invoiceNumber ? { invoiceNumber: a.invoiceNumber } : {}),
        ...(a.memo ? { memo: a.memo } : {}),
      },
    });
    if (risk.level === 'high') await internalNote(p, claim.id, `Payment ${pay.id} issued despite HIGH risk screen. SUPERVISOR OVERRIDE by ${p.sub}: ${a.overrideReason}`);
    return { paid: true, paymentId: pay.id, status: pay.status, ...preview, message: pay.status === 'pending_approval' ? `Created and waiting for supervisor approval (${pay.id}).` : `Payment ${pay.id} is processing; it completes when the bank settles.` };
  },
});

async function paymentCreator(p: any, payment: any): Promise<string | undefined> {
  const tl = (await get(p, `/claims/v1/claims/${payment.claimId}/timeline`)).data as any[];
  return tl.find((e) => e.event === 'payment.created' && e.summary.includes(payment.id))?.actor?.id;
}

export const listPendingApprovals = defineTool({
  name: 'list_pending_approvals',
  title: 'Payments awaiting approval',
  description: 'Supervisor queue: payments held in pending_approval, oldest first, each with the claim context, who created it, whether you are allowed to approve it (nobody approves their own), and risk flags.',
  roles: ['supervisor'],
  input: { limit: z.number().int().min(1).max(25).default(10) },
  readOnly: true,
  handler: async ({ limit }, p) => {
    const pending = (await getAll(p, '/payments/v1/payments', { status: 'pending_approval' }, 3)).sort((x, y) => x.createdAt.localeCompare(y.createdAt)).slice(0, limit);
    const rows = await Promise.all(
      pending.map(async (pay) => {
        const claim = await get(p, `/claims/v1/claims/${pay.claimId}`);
        const creator = await paymentCreator(p, pay);
        const b = await fetchBundle(p, claim);
        const risk = await riskFor(p, b);
        return {
          paymentId: pay.id,
          claimId: claim.id,
          amount: pay.amount,
          type: pay.type,
          payee: pay.payee,
          invoiceNumber: pay.invoiceNumber,
          waitingDays: ageDays(pay.createdAt),
          createdBy: creator ?? 'unknown',
          youCanApprove: !!creator && creator !== p.sub,
          claim: { status: claim.status, customerId: claim.customerId, approvedAmount: statusView(p, b).money.approvedAmount, remainingAfterThis: money(Math.max(0, balanceOf(claim, b.payments, b.refunds).remaining)) },
          risk: { level: risk.level, flags: risk.flags.filter((f) => f.severity !== 'info').map((f) => f.message) },
        };
      }),
    );
    return { count: rows.length, payments: rows };
  },
});

export const approvePayment = defineTool({
  name: 'approve_payment',
  title: 'Approve a held payment',
  description:
    'Supervisor sign-off on a payment held for approval. Enforces four-eyes: you cannot approve a payment you created. confirm=false shows the full context (amount, payee, creator, claim balance, risk) without approving; confirm=true approves it with your comment, which is recorded in the claim\'s audit trail. On a HIGH-risk claim an overrideReason is required.',
  roles: ['supervisor'],
  input: {
    paymentId: z.string().regex(/^pay_/),
    comment: z.string().min(5).max(500).describe('Why this payment is approved'),
    overrideReason: z.string().min(15).max(1000).optional(),
    confirm: z.boolean().default(false),
  },
  destructive: true,
  handler: async (a, p) => {
    const pay = await get(p, `/payments/v1/payments/${a.paymentId}`);
    if (pay.status !== 'pending_approval') throw new ToolError(`Payment ${pay.id} is ${pay.status}; only pending_approval payments can be approved.`);
    const claim = await get(p, `/claims/v1/claims/${pay.claimId}`);
    const creator = await paymentCreator(p, pay);
    if (creator === p.sub) throw new ToolError(`You created ${pay.id}, so you cannot approve it.`, 'Another supervisor must approve it (four-eyes rule). You can cancel it with cancel_payment.');
    const b = await fetchBundle(p, claim);
    const risk = await riskFor(p, b);
    const context = { paymentId: pay.id, amount: pay.amount, payee: pay.payee, type: pay.type, createdBy: creator ?? 'unknown', claim: { id: claim.id, status: claim.status, approved: balanceOf(claim, b.payments, b.refunds).approved }, risk: { level: risk.level, flags: risk.flags.map((f) => f.message) } };
    if (risk.level === 'high' && !a.overrideReason) return { approved: false, needsOverride: true, ...context, message: 'High-risk claim: call again with overrideReason to approve.' };
    if (!a.confirm) return { approved: false, confirmationRequired: true, ...context, message: 'Review, then call again with confirm=true to approve.' };
    const done = await api(p, 'POST', `/payments/v1/payments/${pay.id}/approve`, { body: { comment: a.overrideReason ? `${a.comment} (override: ${a.overrideReason})` : a.comment } });
    return { approved: true, paymentId: done.id, status: done.status, message: 'Approved. The payment is now processing.' };
  },
});

export const cancelPayment = defineTool({
  name: 'cancel_payment',
  title: 'Cancel a payment',
  description: 'Cancels a payment that is still pending_approval or processing (completed payments need a refund instead). Use for wrong payee, wrong amount, or duplicates, e.g. a payment a supervisor declines to approve.',
  roles: [...STAFF],
  input: { paymentId: z.string().regex(/^pay_/), reason: z.enum(['duplicate', 'incorrect_amount', 'incorrect_payee', 'claim_cancelled', 'other']), comment: z.string().max(500).optional() },
  destructive: true,
  handler: async (a, p) => {
    const done = await api(p, 'POST', `/payments/v1/payments/${a.paymentId}/cancel`, { body: { reason: a.reason, ...(a.comment ? { comment: a.comment } : {}) } });
    return { cancelled: true, paymentId: done.id, status: done.status, claimId: done.claimId };
  },
});

export const refundPayment = defineTool({
  name: 'refund_payment',
  title: 'Refund a completed payment',
  description: 'Claws back money from a completed payment (overpayment, duplicate, or reversed claim). Defaults to the full refundable balance. Adjusters can refund up to their authority limit; larger refunds need a supervisor. confirm=true to execute.',
  roles: [...STAFF],
  input: {
    paymentId: z.string().regex(/^pay_/),
    amount: amountSchema.optional().describe('Defaults to the full refundable balance'),
    reason: z.enum(['overpayment', 'duplicate', 'claim_reversed', 'other']),
    requestId: z.string().optional(),
    confirm: z.boolean().default(false),
  },
  destructive: true,
  handler: async (a, p) => {
    const pay = await get(p, `/payments/v1/payments/${a.paymentId}`);
    if (pay.status !== 'completed') throw new ToolError(`Payment ${pay.id} is ${pay.status}; only completed payments can be refunded.`, ['pending_approval', 'processing'].includes(pay.status) ? 'Use cancel_payment instead.' : undefined);
    const refunded = ((await get(p, `/payments/v1/payments/${pay.id}/refunds`)).data as any[]).filter((r) => r.status !== 'failed').reduce((s, r) => s + r.amount.amount, 0);
    const refundable = round2(pay.amount.amount - refunded);
    const amount = a.amount ?? refundable;
    if (amount > refundable + 0.004) throw new ToolError(`Only ${usd(refundable)} of ${pay.id} is refundable.`);
    if (amount > ADJUSTER_APPROVAL_LIMIT && p.role !== 'supervisor') throw new ToolError(`Refunds over ${usd(ADJUSTER_APPROVAL_LIMIT)} need a supervisor.`, 'Ask a supervisor, or add an internal note on the claim.');
    if (!a.confirm) return { refunded: false, confirmationRequired: true, preview: { paymentId: pay.id, refund: money(amount), reason: a.reason, refundableBefore: money(refundable) }, message: 'Call again with confirm=true.' };
    const r = await api(p, 'POST', `/payments/v1/payments/${pay.id}/refunds`, { idempotencyKey: a.requestId ?? randomUUID(), body: { amount: money(amount), reason: a.reason } });
    return { refunded: true, refundId: r.id, status: r.status, amount: r.amount };
  },
});

export const updateVendorWork = defineTool({
  name: 'update_vendor_work',
  title: 'Update vendor work order',
  description: 'Moves a vendor\'s work order along (issued -> accepted -> in_progress -> completed), records their estimate, schedule, or notes. Use to reflect what the vendor reports; completing a job requires an estimate.',
  roles: [...STAFF],
  input: {
    workOrderId: z.string().regex(/^wo_/),
    status: z.enum(['accepted', 'declined', 'in_progress', 'completed', 'cancelled']).optional(),
    estimate: amountSchema.optional(),
    scheduledFor: z.string().optional(),
    notes: z.string().max(1000).optional(),
  },
  handler: async (a, p) => {
    const body = { ...(a.status ? { status: a.status } : {}), ...(a.estimate ? { estimate: money(a.estimate) } : {}), ...(a.scheduledFor ? { scheduledFor: a.scheduledFor } : {}), ...(a.notes ? { notes: a.notes } : {}) };
    if (!Object.keys(body).length) throw new ToolError('Nothing to update: pass status, estimate, scheduledFor, or notes.');
    const wo = await api(p, 'PATCH', `/vendors/v1/work-orders/${a.workOrderId}`, { body });
    return { workOrderId: wo.id, claimId: wo.claimId, vendorId: wo.vendorId, type: wo.type, status: wo.status, estimate: wo.estimate ?? null, scheduledFor: wo.scheduledFor };
  },
});

export const closeoutClaim = defineTool({
  name: 'closeout_claim',
  title: 'Close-out review',
  description:
    'Checks whether a claim can be closed: no open vendor jobs, no payments in flight, nothing still owed to the customer or to vendors who finished work, and no customer message left unanswered. Returns blockers with the action that clears each. With finalize=true and no blockers it records closing notes (internal summary and a customer-visible closing message). Settlement itself is automatic once the approved amount is fully paid.',
  roles: [...STAFF],
  input: { claimId, finalize: z.boolean().default(false) },
  destructive: false,
  handler: async ({ claimId: id, finalize }, p) => {
    const claim = await getAccessibleClaim(p, id);
    const b: Bundle = await fetchBundle(p, claim);
    const workOrders = await getAll(p, '/vendors/v1/work-orders', { claimId: id });
    const bal = balanceOf(claim, b.payments, b.refunds);
    const blockers: { issue: string; action: string }[] = [];
    if (['draft', 'submitted', 'under_review'].includes(claim.status)) blockers.push({ issue: `Claim is still ${claim.status}.`, action: 'Complete review: decide_claim.' });
    for (const w of workOrders.filter((x) => ['issued', 'accepted', 'in_progress'].includes(x.status))) blockers.push({ issue: `${w.type} job ${w.id} is ${w.status}.`, action: 'update_vendor_work to complete or cancel it.' });
    for (const x of b.payments.filter((x) => ['pending_approval', 'processing'].includes(x.status))) blockers.push({ issue: `Payment ${x.id} (${usd(x.amount.amount)}) is ${x.status}.`, action: x.status === 'pending_approval' ? 'approve_payment or cancel_payment.' : 'Wait for it to settle.' });
    if (claim.status === 'approved' && bal.remaining > 0.004) blockers.push({ issue: `${usd(bal.remaining)} of the approved amount is unpaid.`, action: 'issue_payment. The claim settles automatically once fully paid.' });
    for (const w of workOrders.filter((x) => x.status === 'completed')) {
      if (!b.payments.some((x) => x.payee.id === w.vendorId && !['cancelled', 'failed'].includes(x.status))) blockers.push({ issue: `Vendor ${w.vendorId} completed ${w.type} work but has not been paid.`, action: 'issue_payment(payee="vendor", ...).' });
    }
    const lastCustomer = [...b.notes].reverse().find((n) => n.author.type === 'customer');
    const lastStaff = [...b.notes].reverse().find((n) => ['adjuster', 'system'].includes(n.author.type) && n.visibility === 'customer');
    if (lastCustomer && (!lastStaff || lastStaff.createdAt < lastCustomer.createdAt)) blockers.push({ issue: 'The customer\'s last message has no reply.', action: 'add_note(visibility="customer") to respond.' });
    const terminal = ['settled', 'closed', 'cancelled', 'denied'].includes(claim.status);
    const ready = terminal && blockers.length === 0;
    const out: Record<string, unknown> = {
      claimId: id,
      status: claim.status,
      readyToClose: ready,
      blockers,
      financials: { approved: money(bal.approved), paidOut: money(bal.paidOut), unpaid: money(Math.max(0, bal.remaining)) },
      lastActivity: lastActivity(b),
    };
    if (finalize) {
      if (!ready) throw new ToolError('Cannot finalize: there are blockers or the claim is not in a final state.', undefined, { blockers });
      const summary = `Closing summary (${p.sub}): claim ${id} ${claim.status}. Approved ${usd(bal.approved)}, paid out ${usd(bal.paidOut)}, ${workOrders.length} vendor job(s), ${b.payments.length} payment(s).`;
      await internalNote(p, id, summary);
      if (claim.status !== 'cancelled') await customerNote(p, id, `Your claim ${id} is complete. Thank you for letting us help. If anything looks wrong, reply here within 30 days and we'll reopen it.`);
      out.finalized = true;
      out.note = 'Closing notes were recorded. The Claims API has no "closed" transition, so the claim status stays as shown.';
    }
    return out;
  },
});

export const staffTools = [claimsWorklist, claimDossier, assessClaimRisk, startClaimReview, setEstimate, decideClaim, issuePayment, listPendingApprovals, approvePayment, cancelPayment, refundPayment, updateVendorWork, closeoutClaim];
