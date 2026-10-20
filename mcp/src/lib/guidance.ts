/** Plain-language status text, next steps, and the help knowledge base. */
import type { Balance } from './claims';
import { ADJUSTER_APPROVAL_LIMIT, PAYMENT_APPROVAL_THRESHOLD } from './config';
import { usd } from './format';

export const STATUS_PLAIN: Record<string, string> = {
  draft: 'Saved but not submitted yet. Nothing happens until it is submitted.',
  submitted: 'Received. It is waiting for an adjuster to be assigned and start the review.',
  under_review: 'An adjuster is reviewing the loss, coverage, and repair estimate.',
  approved: 'Approved. The approved amount is the repair estimate minus your deductible, and payments are being arranged.',
  denied: 'Not approved. The decision and the reason are in the claim notes; you can ask for a review.',
  settled: 'Fully paid. All approved amounts have been paid out.',
  closed: 'Closed. No further action is needed.',
  cancelled: 'Cancelled. Open vendor work and unpaid payments were cancelled with it.',
};

interface Ctx {
  claim: any;
  bal: Balance;
  assignments: any[];
  payments: any[];
}

export function customerNextSteps(c: Ctx & { hasPayout: boolean }): string[] {
  const { claim, bal, assignments, payments } = c;
  const steps: string[] = [];
  const openWork = assignments.filter((a) => ['requested', 'accepted', 'in_progress'].includes(a.status));
  switch (claim.status) {
    case 'draft':
      steps.push('Review the details, then submit the claim with submit_claim so an adjuster can start.');
      break;
    case 'submitted':
      steps.push('No action needed. An adjuster is normally assigned within one business day; you can add notes or photos details with add_note.');
      if (claim.drivable === false && !assignments.some((a) => a.role === 'tow')) steps.push('Your vehicle is not drivable: request a tow with request_service(serviceType="tow").');
      break;
    case 'under_review':
      steps.push('Your adjuster is reviewing. Respond promptly to any note they leave, and choose a repair shop with find_vendors if you have not.');
      if (!assignments.some((a) => a.role === 'repair')) steps.push('Pick an in-network repair shop: find_vendors(claimId, type="repair"), then request_service.');
      break;
    case 'approved':
      if (!c.hasPayout && bal.remaining > 0) steps.push('Add a payout method (add_payout_method) so your settlement can be deposited.');
      if (payments.some((p: any) => p.status === 'pending_approval')) steps.push('A payment is waiting for supervisor sign-off, which is required for larger amounts.');
      else if (bal.remaining > 0) steps.push(`Your adjuster will issue the remaining ${usd(bal.remaining)}. You can ask for an update with add_note.`);
      break;
    case 'denied':
      steps.push('Read the explanation in the claim notes. If you disagree, reply with add_note and any new information; a supervisor can review.');
      break;
    case 'settled':
      steps.push('All set. Keep your records; the claim will be closed after final checks.');
      break;
  }
  if (openWork.length) steps.push(`${openWork.length} service provider job(s) in progress; see "vendors" for contacts and schedule.`);
  return steps;
}

export function staffNextActions(c: Ctx & { role: string }): string[] {
  const { claim, bal, assignments, payments, role } = c;
  const steps: string[] = [];
  const approvedAmt = Math.max(0, (claim.estimatedAmount?.amount ?? 0) - (claim.deductible?.amount ?? 0));
  switch (claim.status) {
    case 'draft':
      steps.push('Draft: the customer has not submitted. Nothing to do unless they ask you to (submit_claim).');
      break;
    case 'submitted':
      steps.push('Unassigned intake: start_claim_review (assigns you, optionally sets an estimate, runs the risk screen).');
      break;
    case 'under_review':
      if (!claim.estimatedAmount) steps.push('Set an estimate (set_estimate) from the appraisal or shop estimate.');
      else if (approvedAmt > ADJUSTER_APPROVAL_LIMIT && role !== 'supervisor')
        steps.push(`Approved amount ${usd(approvedAmt)} exceeds your ${usd(ADJUSTER_APPROVAL_LIMIT)} authority: decide_claim will escalate to a supervisor.`);
      else steps.push('Ready for a decision: assess_claim_risk, then decide_claim (approve or deny).');
      if (!assignments.length) steps.push('No vendors yet: request_service for tow/appraisal/repair as needed.');
      break;
    case 'approved':
      if (payments.some((p: any) => p.status === 'pending_approval')) steps.push('Payment(s) awaiting supervisor approval: approve_payment / list_pending_approvals.');
      if (bal.remaining > 0) steps.push(`Remaining approved balance ${usd(bal.remaining)}: issue_payment (omit amount to pay it all).`);
      if (!bal.remaining && !payments.some((p: any) => ['pending_approval', 'processing'].includes(p.status))) steps.push('Fully paid; the claim settles automatically once payments complete.');
      break;
    case 'settled':
      steps.push('Run closeout_claim to confirm nothing is outstanding and send the closing message.');
      break;
  }
  return steps;
}

export type HelpTopic = keyof typeof HELP;

export const HELP = {
  how_it_works: {
    title: 'How a claim works',
    body: [
      '1. Report: file the claim (file_claim). We verify your policy and coverage immediately and tell you your deductible.',
      '2. Review: an adjuster is assigned, reviews the loss, and sets a repair estimate. They may leave notes you can answer.',
      '3. Decision: the claim is approved (approved amount = estimate minus deductible) or denied with an explanation.',
      '4. Repair and payment: in-network shops are paid directly; any remaining amount is paid to you. Larger payments get a second-person approval.',
      '5. Settled: once every approved dollar is paid the claim settles automatically and is then closed.',
    ],
  },
  filing: {
    title: 'Filing a claim',
    body: [
      'You need: which policy and vehicle, what happened, the date and place, whether the car is drivable, and whether anyone was hurt.',
      'If anyone is injured or in danger, call 911 first. File the claim afterwards.',
      'For theft or vandalism, file a police report and give us the report number; claims without one take longer.',
      'Claims can be filed up to any time, but reporting within 30 days avoids extra review.',
      'You cannot file the same loss twice (same policy, vehicle, type, and date).',
    ],
  },
  coverage: {
    title: 'What is covered',
    body: [
      'Collision: damage to your vehicle from a crash. Comprehensive: theft, vandalism, weather, animals, fire. Full Glass: windshield and window repair (otherwise Comprehensive applies).',
      'Liability (Property Damage / Combined Single Limit): damage you cause to others.',
      'The policy must be in force on the loss date; lapsed, cancelled, expired, or quoted policies are not covered.',
      'Use check_coverage to see exactly what your policy pays for a given loss, your deductible, and your rental and towing benefits.',
    ],
  },
  deductible: {
    title: 'Your deductible',
    body: [
      'The deductible is the part of an approved repair you pay. It is set by the coverage that pays for the loss (for example Collision) and recorded on the claim.',
      'Approved amount = repair estimate - deductible. Example: a $4,850 estimate with a $500 deductible is a $4,350 approved amount.',
      'If a shop is paid directly, the shop collects the deductible from you.',
    ],
  },
  payments: {
    title: 'Getting paid',
    body: [
      'Add a payout method (bank account or debit card) with add_payout_method; we never see full account numbers.',
      `Payments to you over ${usd(PAYMENT_APPROVAL_THRESHOLD.customer)} (and to shops over ${usd(PAYMENT_APPROVAL_THRESHOLD.vendor)}) need a supervisor's approval, which adds time.`,
      'Payments show as processing and then completed once the bank settles them (usually minutes in this demo, 1-3 business days in practice).',
      'A claim settles automatically when the full approved amount has been paid.',
    ],
  },
  vendors: {
    title: 'Tow, repair, rental, and glass',
    body: [
      'Use find_vendors to see in-network providers near the loss, ranked by distance and rating. In-network vendors bill us directly.',
      'Use request_service to book one. Vendors must be active, in network, and serve the loss location.',
      'Rental reimbursement and towing are only paid if your policy carries RENT / TOW coverage; check_coverage shows your daily rental limit.',
    ],
  },
  injuries: {
    title: 'Injuries and safety',
    body: [
      'If anyone is hurt or the scene is unsafe, call 911. Do not move the vehicle if it is unsafe to do so.',
      'Tell us about injuries when filing: those claims are prioritised and may involve medical payments or liability coverage.',
    ],
  },
  cancelling: {
    title: 'Cancelling a claim',
    body: [
      'You can cancel a claim yourself until it is approved. Cancelling stops open vendor jobs and any unpaid payments.',
      'Payments that already completed are not reversed by cancelling. After approval, ask your adjuster.',
      'cancel_claim first shows you exactly what will be cancelled; nothing happens until you confirm.',
    ],
  },
  denials: {
    title: 'If a claim is denied',
    body: [
      'A denial always comes with an explanation in the claim notes.',
      'Reply with add_note and any new evidence (police report, receipts, photos). A supervisor can review a denial.',
    ],
  },
} as const;
