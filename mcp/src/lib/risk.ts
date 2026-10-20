/**
 * Claim risk screen: transparent, rule-based indicators an adjuster would check before approving. These are
 * MCP-layer heuristics for the demo, not a fraud model; every flag says why it fired so the output is auditable.
 */
import { ADJUSTER_APPROVAL_LIMIT, LATE_REPORT_DAYS } from './config';
import { daysBetween } from './format';

export interface Flag {
  code: string;
  severity: 'info' | 'medium' | 'high';
  points: number;
  message: string;
}
export interface Risk {
  score: number;
  level: 'low' | 'medium' | 'high';
  flags: Flag[];
  recommendation: string;
}

export function assessRisk(i: { claim: any; customer?: any; policy?: any; verification?: any; others: any[]; bal: { approved: number } }): Risk {
  const { claim, customer, policy, verification, others, bal } = i;
  const flags: Flag[] = [];
  const add = (code: string, points: number, message: string, severity: Flag['severity'] = points >= 30 ? 'high' : 'medium') => flags.push({ code, severity, points, message });
  const created = claim.createdAt.slice(0, 10);

  if (customer?.status === 'suspended') add('CUSTOMER_SUSPENDED', 50, 'Customer account is suspended (fraud). Claims need SIU review before any payout.');
  else if (customer?.status === 'inactive') add('CUSTOMER_INACTIVE', 15, 'Customer account is inactive (moved or did not renew). Confirm the policy was in force.');

  if (verification && !verification.covered) {
    add('COVERAGE_NOT_VERIFIED', 40, `Coverage re-check failed: ${verification.reasons?.map((r: any) => r.message).join(' ') ?? 'not covered'}`);
  } else if (verification?.reasons?.some((r: any) => r.code === 'ADJUSTER_REVIEW_REQUIRED')) {
    add('ADJUSTER_COVERAGE_DETERMINATION', 10, 'Loss type "other": the adjuster must decide which coverage applies.', 'info');
  }

  const lag = daysBetween(claim.lossDate, created);
  if (lag > 60) add('LATE_REPORT', 25, `Reported ${lag} days after the loss (more than 60).`);
  else if (lag > LATE_REPORT_DAYS) add('LATE_REPORT', 15, `Reported ${lag} days after the loss (more than ${LATE_REPORT_DAYS}).`);

  if (policy?.effectiveDate) {
    const sinceInception = daysBetween(policy.effectiveDate, claim.lossDate);
    if (sinceInception >= 0 && sinceInception <= 30) add('EARLY_IN_TERM', 15, `Loss occurred ${sinceInception} days after the policy term began.`);
  }

  const peers = others.filter((o) => o.id !== claim.id && o.status !== 'cancelled');
  const samePolicyYear = peers.filter((o) => o.policyId === claim.policyId && Math.abs(daysBetween(o.lossDate, claim.lossDate)) <= 365);
  if (samePolicyYear.length >= 3) add('CLAIM_FREQUENCY', 20, `${samePolicyYear.length} other claims on this policy within a year of this loss.`);
  else if (samePolicyYear.length === 2) add('CLAIM_FREQUENCY', 10, '2 other claims on this policy within a year of this loss.');
  const sameVehicle = claim.vehicleId ? peers.filter((o) => o.vehicleId === claim.vehicleId && Math.abs(daysBetween(o.lossDate, claim.lossDate)) <= 30) : [];
  if (sameVehicle.length) add('REPEAT_VEHICLE_LOSS', 20, `Same vehicle had another claim within 30 days (${sameVehicle.map((o) => o.id).join(', ')}). Check for overlapping damage.`);

  if (claim.type === 'theft' && !claim.policeReportNumber) add('THEFT_NO_POLICE_REPORT', 25, 'Theft claim without a police report number.');
  else if (claim.injuries && !claim.policeReportNumber) add('INJURY_NO_POLICE_REPORT', 10, 'Injuries reported but no police report number on file.');

  const limit = verification?.coverage?.limit?.amount;
  if (limit && claim.estimatedAmount?.amount > limit) add('ESTIMATE_OVER_LIMIT', 20, `Estimate ${claim.estimatedAmount.amount} exceeds the coverage limit of ${limit}.`);

  if (bal.approved > ADJUSTER_APPROVAL_LIMIT) add('SUPERVISOR_AUTHORITY', 0, `Approved amount ${bal.approved} exceeds the adjuster authority limit of ${ADJUSTER_APPROVAL_LIMIT}; supervisor approval required.`, 'info');

  const score = flags.reduce((s, f) => s + f.points, 0);
  const level = score >= 45 ? 'high' : score >= 20 ? 'medium' : 'low';
  const recommendation =
    level === 'high'
      ? 'Hold. Refer to a supervisor/SIU before approving or paying; a supervisor override with a documented reason is required to proceed.'
      : level === 'medium'
        ? 'Verify the flagged items (documents, photos, prior claims) and record the outcome in an internal note before approving.'
        : 'Standard handling.';
  return { score, level, flags, recommendation };
}
