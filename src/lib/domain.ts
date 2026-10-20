/**
 * Business rules shared across APIs: coverage verification (Policy API, used by Claims API on
 * claim creation), claim approved balance (Claims + Payments), and simulated payment settlement.
 */
import { query, one, type Db, pool } from '../db';
import { iso, money, compact, round2, fmtUsd, recordEvent } from './http';

export type ClaimType = 'collision' | 'comprehensive' | 'theft' | 'glass' | 'vandalism' | 'weather' | 'liability' | 'other';

/** Which coverage pays for each claim type, in order of preference. */
export const CLAIM_COVERAGE: Record<ClaimType, string[]> = {
  collision: ['COLL'],
  comprehensive: ['COMP'],
  theft: ['COMP'],
  glass: ['GLASS', 'COMP'],
  vandalism: ['COMP'],
  weather: ['COMP'],
  liability: ['PD', 'CSL'],
  other: [],
};

const COVERAGE_NAMES: Record<string, string> = { COLL: 'Collision', COMP: 'Comprehensive', GLASS: 'Full Glass', PD: 'Property Damage Liability', CSL: 'Combined Single Limit Liability' };

export function toCoverage(r: any) {
  return compact({
    code: r.code,
    name: r.name,
    limit: money(r.limit_amount, r.currency),
    deductible: money(r.deductible_amount, r.currency),
    dailyLimit: money(r.daily_limit_amount, r.currency),
  });
}

export interface VerificationReason {
  code: string;
  message: string;
}

export interface VerificationResult {
  covered: boolean;
  policyId: string;
  lossDate: string;
  coverage?: ReturnType<typeof toCoverage>;
  reasons: VerificationReason[];
  verifiedAt: string;
  /** Internal: raw coverage row used for deductible lookup. */
  _coverageRow?: any;
}

export async function verifyCoverage(
  db: Db,
  policy: any,
  req: { lossDate: string; claimType: ClaimType; vehicleId?: string; driverId?: string },
): Promise<VerificationResult> {
  const reasons: VerificationReason[] = [];
  const { lossDate } = req;

  if (policy.status === 'quoted') {
    reasons.push({ code: 'POLICY_NOT_IN_FORCE', message: 'Policy is a quote and was never bound.' });
  } else if (lossDate < policy.effective_date) {
    reasons.push({ code: 'LOSS_BEFORE_EFFECTIVE_DATE', message: `Loss date is before the policy effective date (${policy.effective_date}).` });
  } else if (policy.status === 'lapsed' && policy.status_date && lossDate >= policy.status_date) {
    reasons.push({ code: 'POLICY_LAPSED', message: 'Policy was not active on the loss date.' });
  } else if (policy.status === 'cancelled' && policy.status_date && lossDate >= policy.status_date) {
    reasons.push({ code: 'POLICY_CANCELLED', message: `Policy was cancelled effective ${policy.status_date}.` });
  } else if (lossDate >= policy.expiration_date) {
    reasons.push({ code: 'POLICY_EXPIRED', message: `Policy expired on ${policy.expiration_date}.` });
  }

  if (req.vehicleId) {
    const onPolicy = await one(`SELECT 1 FROM policy_vehicles WHERE policy_id = $1 AND vehicle_id = $2`, [policy.id, req.vehicleId], db);
    if (!onPolicy) reasons.push({ code: 'VEHICLE_NOT_ON_POLICY', message: `Vehicle ${req.vehicleId} is not insured under this policy.` });
  }
  if (req.driverId) {
    const listed = await one(`SELECT 1 FROM drivers WHERE policy_id = $1 AND id = $2`, [policy.id, req.driverId], db);
    if (!listed) reasons.push({ code: 'DRIVER_NOT_LISTED', message: `Driver ${req.driverId} is not a listed driver on this policy.` });
  }

  let coverageRow: any;
  const codes = CLAIM_COVERAGE[req.claimType] ?? [];
  if (codes.length) {
    const rows = await query(`SELECT * FROM policy_coverages WHERE policy_id = $1 AND code = ANY($2)`, [policy.id, codes], db);
    coverageRow = codes.map((c) => rows.find((r) => r.code === c)).find(Boolean);
    if (!coverageRow) {
      reasons.push({
        code: 'COVERAGE_NOT_PURCHASED',
        message: `Policy does not include ${COVERAGE_NAMES[codes[0]] ?? codes[0]} coverage, which is required for ${req.claimType} losses.`,
      });
    }
  }

  const covered = reasons.length === 0;
  if (covered && req.claimType === 'other') {
    reasons.push({ code: 'ADJUSTER_REVIEW_REQUIRED', message: 'Losses of type "other" require an adjuster to determine the applicable coverage.' });
  }

  return compact({
    covered,
    policyId: policy.id,
    lossDate,
    coverage: covered && coverageRow ? toCoverage(coverageRow) : undefined,
    reasons,
    verifiedAt: iso(new Date())!,
    _coverageRow: covered ? coverageRow : undefined,
  });
}

// ---- Claim balance ------------------------------------------------------------------------------

/** Statuses in which a claim is still open (blocks customer deactivation). */
export const OPEN_CLAIM_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'settled'];

export interface ClaimBalance {
  approved: number;
  committed: number;
  remaining: number;
}

/**
 * Approved amount is the adjuster's estimate less the deductible. Payments that are pending,
 * processing, or completed count against it; completed refunds give the money back.
 */
export async function claimBalance(db: Db, claim: any): Promise<ClaimBalance> {
  const approved = Math.max(0, round2((claim.estimated_amount ?? 0) - (claim.deductible_amount ?? 0)));
  const row = await one(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM payments WHERE claim_id = $1 AND type <> 'premium_refund'
                 AND status IN ('pending_approval', 'processing', 'completed', 'refunded')), 0) AS paid,
       COALESCE((SELECT SUM(r.amount) FROM refunds r JOIN payments p ON p.id = r.payment_id
                 WHERE p.claim_id = $1 AND p.type <> 'premium_refund' AND r.status <> 'failed'), 0) AS refunded`,
    [claim.id],
    db,
  );
  const committed = round2(row.paid - row.refunded);
  return { approved, committed, remaining: round2(approved - committed) };
}

// ---- Simulated bank settlement ------------------------------------------------------------------

export const SETTLEMENT_SECONDS = Math.max(0, parseInt(process.env.PAYMENT_SETTLEMENT_SECONDS ?? '5', 10));
export const settleAfter = () => new Date(Date.now() + SETTLEMENT_SECONDS * 1000);

let settling: Promise<void> | null = null;

/** Completes processing payments/refunds whose settlement time has passed, then settles fully paid claims. */
export function settleDue(): Promise<void> {
  if (!settling) settling = runSettlement().finally(() => (settling = null));
  return settling;
}

async function runSettlement() {
  const bank = { type: 'system', id: 'sys_payments' };
  const paid = await query(
    `UPDATE payments SET status = 'completed', completed_at = settle_after, updated_at = now()
     WHERE status = 'processing' AND settle_after IS NOT NULL AND settle_after <= now()
     RETURNING id, claim_id, amount, payee_type, payee_id, completed_at`,
  );
  for (const p of paid) {
    await recordEvent(pool, p.claim_id, 'payment.completed', `Payment ${p.id} of ${fmtUsd(p.amount)} to ${p.payee_type} ${p.payee_id} completed.`, bank, p.completed_at);
  }
  const refunds = await query(
    `UPDATE refunds r SET status = 'completed', completed_at = r.settle_after
     FROM payments p WHERE p.id = r.payment_id AND r.status = 'processing' AND r.settle_after IS NOT NULL AND r.settle_after <= now()
     RETURNING r.id, r.payment_id, r.amount, r.completed_at, p.claim_id`,
  );
  for (const r of refunds) {
    await recordEvent(pool, r.claim_id, 'refund.completed', `Refund ${r.id} of ${fmtUsd(r.amount)} on payment ${r.payment_id} completed.`, bank, r.completed_at);
  }
  if (refunds.length) {
    await query(
      `UPDATE payments p SET status = 'refunded', updated_at = now()
       WHERE p.status = 'completed' AND p.id = ANY($1)
         AND p.amount <= (SELECT COALESCE(SUM(amount), 0) FROM refunds WHERE payment_id = p.id AND status = 'completed')`,
      [refunds.map((r) => r.payment_id)],
    );
  }
  const claimIds = [...new Set(paid.map((p) => p.claim_id))];
  for (const claimId of claimIds) {
    const claim = await one(`SELECT * FROM claims WHERE id = $1`, [claimId]);
    if (claim?.status !== 'approved') continue;
    const inFlight = await one(`SELECT 1 FROM payments WHERE claim_id = $1 AND status IN ('pending_approval', 'processing')`, [claimId]);
    const bal = await claimBalance(pool, claim);
    if (!inFlight && bal.remaining <= 0.004) {
      await query(`UPDATE claims SET status = 'settled', updated_at = now() WHERE id = $1`, [claimId]);
      await recordEvent(pool, claimId, 'claim.status_changed', `Status changed from approved to settled. All approved amounts (${fmtUsd(bal.approved)}) paid.`, bank);
    }
  }
}
