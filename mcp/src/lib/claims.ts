/**
 * Claim read model. Fans out across the Claims, Policy, Customer, Vendors, and Payments APIs and joins the
 * results into one view, adding the derived facts (balance, stage, next steps, risk) the raw APIs do not provide.
 */
import type { Principal } from './auth';
import { isCustomerAudience } from './auth';
import { api, get, getAll, tryGet } from './upstream';
import { money, round2, ageDays, addr } from './format';
import { assessRisk, type Risk } from './risk';
import { customerNextSteps, staffNextActions, STATUS_PLAIN } from './guidance';

const COMMITTED = ['pending_approval', 'processing', 'completed', 'refunded'];

export interface Bundle {
  claim: any;
  assignments: any[];
  vendors: Record<string, any>;
  timeline: any[];
  notes: any[];
  payments: any[];
  refunds: Record<string, any[]>;
  policy?: any;
  customer?: any;
}

export function balanceOf(claim: any, payments: any[], refunds: Record<string, any[]>) {
  const approved = Math.max(0, round2((claim.estimatedAmount?.amount ?? 0) - (claim.deductible?.amount ?? 0)));
  const counted = payments.filter((p) => p.type !== 'premium_refund' && COMMITTED.includes(p.status));
  const paid = counted.reduce((s, p) => s + p.amount.amount, 0);
  const refunded = counted.flatMap((p) => refunds[p.id] ?? []).filter((r) => r.status !== 'failed').reduce((s, r) => s + r.amount.amount, 0);
  const committed = round2(paid - refunded);
  const settled = payments.filter((p) => p.type !== 'premium_refund' && ['completed', 'refunded'].includes(p.status));
  const paidOut = round2(
    settled.reduce((s, p) => s + p.amount.amount, 0) -
      settled.flatMap((p) => refunds[p.id] ?? []).filter((r) => r.status === 'completed').reduce((s, r) => s + r.amount.amount, 0),
  );
  return { approved, committed, paidOut, remaining: round2(approved - committed) };
}
export type Balance = ReturnType<typeof balanceOf>;

export async function fetchBundle(p: Principal, claim: any): Promise<Bundle> {
  const id = claim.id;
  const [assignments, timeline, notes, payments, policy, customer] = await Promise.all([
    get(p, `/claims/v1/claims/${id}/assignments`).then((r) => r.data as any[]),
    get(p, `/claims/v1/claims/${id}/timeline`).then((r) => r.data as any[]),
    get(p, `/claims/v1/claims/${id}/notes`).then((r) => r.data as any[]),
    getAll(p, '/payments/v1/payments', { claimId: id }),
    tryGet(p, `/policies/v1/policies/${claim.policyId}`),
    tryGet(p, `/customers/v1/customers/${claim.customerId}`),
  ]);
  const vendors: Record<string, any> = {};
  await Promise.all([...new Set(assignments.map((a) => a.vendorId as string))].map(async (v) => (vendors[v] = await tryGet(p, `/vendors/v1/vendors/${v}`))));
  const refunds: Record<string, any[]> = {};
  await Promise.all(
    payments.filter((x) => ['completed', 'refunded'].includes(x.status)).map(async (x) => (refunds[x.id] = (await get(p, `/payments/v1/payments/${x.id}/refunds`)).data)),
  );
  return { claim, assignments, vendors, timeline, notes, payments, refunds, policy, customer };
}

/** Customers should not see internal reasoning (internal notes, fraud-related cancel reasons) in the audit trail. */
function customerTimeline(events: any[]) {
  return events
    .filter((e) => !/^Internal note/.test(e.summary))
    .map((e) => ({
      at: e.at,
      event: e.event,
      summary: e.event === 'claim.cancelled' ? e.summary.replace(/ \((fraud_suspected|policy_issue)\)/, '') : e.summary,
    }));
}

export const assignmentView = (b: Bundle) =>
  b.assignments.map((a) => ({
    id: a.id,
    vendorId: a.vendorId,
    vendor: b.vendors[a.vendorId]?.name,
    phone: b.vendors[a.vendorId]?.phone,
    role: a.role,
    status: a.status,
    scheduledFor: a.scheduledFor,
  }));

export const lastActivity = (b: Bundle): string => (b.timeline.length ? b.timeline[b.timeline.length - 1].at : b.claim.updatedAt);

/** The status view: customer-safe for customers and agents; staff additionally see internal notes and payment detail. */
export function statusView(p: Principal, b: Bundle) {
  const { claim } = b;
  const bal = balanceOf(claim, b.payments, b.refunds);
  const customerView = isCustomerAudience(p);
  const own = (x: any) => x.payee.type === 'customer';
  const vendorPaid = b.payments.filter((x) => x.payee.type === 'vendor' && ['processing', 'completed'].includes(x.status));
  const payments = (customerView ? b.payments.filter(own) : b.payments).map((x) => ({
    id: x.id,
    type: x.type,
    payee: x.payee,
    amount: x.amount,
    status: x.status,
    createdAt: x.createdAt,
    completedAt: x.completedAt,
    ...(customerView ? {} : { invoiceNumber: x.invoiceNumber, memo: x.memo }),
  }));
  const hasPayout = b.payments.some(own);
  return {
    claimId: claim.id,
    status: claim.status,
    statusMeaning: STATUS_PLAIN[claim.status],
    type: claim.type,
    lossDate: claim.lossDate,
    lossLocation: addr(claim.lossLocation),
    description: claim.description,
    policyId: claim.policyId,
    vehicleId: claim.vehicleId,
    assignedAdjusterId: claim.assignedAdjusterId ?? null,
    deductible: claim.deductible,
    estimate: claim.estimatedAmount ?? null,
    money: {
      approvedAmount: money(bal.approved),
      paidOut: money(bal.paidOut),
      inFlightOrPaid: money(bal.committed),
      remainingToPay: money(Math.max(0, bal.remaining)),
      ...(customerView && vendorPaid.length ? { paidDirectlyToProviders: money(vendorPaid.reduce((s, x) => s + x.amount.amount, 0)) } : {}),
    },
    vendors: assignmentView(b),
    payments,
    notes: (customerView ? b.notes.filter((n) => n.visibility === 'customer') : b.notes).slice(-5),
    timeline: (customerView ? customerTimeline(b.timeline) : b.timeline).slice(-8),
    daysOpen: ageDays(claim.createdAt),
    nextSteps: customerView
      ? customerNextSteps({ claim, bal, assignments: b.assignments, payments: b.payments, hasPayout })
      : staffNextActions({ claim, bal, assignments: b.assignments, payments: b.payments, role: p.role }),
  };
}

/** Staff-only fraud/leakage screen. Uses the customer's other claims, the policy, and a coverage re-verification. */
export async function riskFor(p: Principal, b: Bundle): Promise<Risk> {
  const { claim } = b;
  const [others, verification] = await Promise.all([
    getAll(p, '/claims/v1/claims', { customerId: claim.customerId }, 3),
    api(p, 'POST', `/policies/v1/policies/${claim.policyId}/coverage-verifications`, {
      body: { lossDate: claim.lossDate, claimType: claim.type, ...(claim.vehicleId ? { vehicleId: claim.vehicleId } : {}) },
    }).catch(() => undefined),
  ]);
  return assessRisk({ claim, customer: b.customer, policy: b.policy, verification, others, bal: balanceOf(claim, b.payments, b.refunds) });
}
