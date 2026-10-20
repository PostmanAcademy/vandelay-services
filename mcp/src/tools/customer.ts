/** Customer-facing tools, also used by agents acting for one customer and by staff acting on a customer's behalf. */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { defineTool, ToolError } from '../lib/kit';
import { customerScope, getAccessibleClaim } from '../lib/access';
import { isCustomerAudience, isStaff } from '../lib/auth';
import { api, get, getAll, tryGet } from '../lib/upstream';
import { fetchBundle, statusView } from '../lib/claims';
import { claimPostalCode, rankVendors } from '../lib/vendors';
import { HELP, type HelpTopic } from '../lib/guidance';
import { addr, today, usd, daysBetween } from '../lib/format';
import { LATE_REPORT_DAYS } from '../lib/config';

const ALL = ['customer', 'agent', 'adjuster', 'supervisor'] as const;

const addressSchema = z.object({
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string().describe('Two-letter state, e.g. NC'),
  postalCode: z.string(),
  country: z.string().default('US'),
});
const claimType = z.enum(['collision', 'comprehensive', 'theft', 'glass', 'vandalism', 'weather', 'liability', 'other']);
const claimId = z.string().regex(/^clm_[0-9]{4}-[0-9]{6}$/).describe('Claim ID, e.g. clm_2026-000417');

const stable = (...parts: unknown[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 40);
const helpfulCoverage = (c: any) => c && { code: c.code, name: c.name, limit: c.limit, deductible: c.deductible, dailyLimit: c.dailyLimit };

export const whoami = defineTool({
  name: 'whoami',
  title: 'Who am I and what can I do',
  description: 'Shows the identity, role, and permissions this connection has, the tools available to it, and the limits that apply. Call this first if unsure what you can do.',
  roles: [...ALL],
  input: {},
  readOnly: true,
  handler: async (_a, p) => ({
    name: p.name,
    id: p.sub,
    role: p.role,
    scopes: p.scopes,
    actingForCustomer: p.customerId ?? null,
    can:
      p.role === 'customer'
        ? 'Open and manage your own claims, arrange towing/rentals/repairs, add notes, and manage payout methods.'
        : p.role === 'agent'
          ? p.customerId
            ? `Help customer ${p.customerId} with their claims. No access to payments, internal notes, or other customers.`
            : 'General help and vendor search only. Not bound to a customer: reconnect with "X-On-Behalf-Of: <customerId>".'
          : p.role === 'adjuster'
            ? 'Work the claims queue, review, estimate, approve within authority, dispatch vendors, issue payments (large ones need a supervisor).'
            : 'Everything an adjuster can do, plus approve payments, approve high-value or flagged claims with a documented override.',
  }),
});

export const claimsHelp = defineTool({
  name: 'claims_help',
  title: 'Help with claims',
  description:
    'Plain-language help on how claims work: filing, coverage, deductibles, payments, vendors, injuries, cancelling, and denials. Pass a claimId to also get your personalised next steps.',
  roles: [...ALL],
  input: {
    topic: z.enum(Object.keys(HELP) as [HelpTopic, ...HelpTopic[]]).default('how_it_works'),
    claimId: claimId.optional().describe('Include to add next steps for this specific claim'),
  },
  readOnly: true,
  handler: async ({ topic, claimId: id }, p) => {
    const h = HELP[topic as HelpTopic];
    const out: Record<string, unknown> = { topic: h.title, guidance: h.body, otherTopics: Object.keys(HELP).filter((k) => k !== topic) };
    if (id) {
      const claim = await getAccessibleClaim(p, id);
      out.yourClaim = { claimId: claim.id, status: claim.status, nextSteps: statusView(p, await fetchBundle(p, claim)).nextSteps };
    }
    return out;
  },
});

export const listPolicies = defineTool({
  name: 'list_policies',
  title: 'List policies',
  description: 'Lists the customer\'s policies with status, term, insured vehicles, and coverages (limits and deductibles). Use before filing a claim to choose the right policy and vehicle.',
  roles: [...ALL],
  input: { customerId: z.string().optional().describe('Staff only: the customer to look up') },
  readOnly: true,
  handler: async ({ customerId }, p) => {
    const cid = customerScope(p, customerId);
    if (!cid) throw new ToolError('customerId is required.');
    const policies = await getAll(p, '/policies/v1/policies', { customerId: cid });
    const detailed = await Promise.all(
      policies.map(async (pol) => {
        const [vehicles, coverages] = await Promise.all([
          get(p, `/policies/v1/policies/${pol.id}/vehicles`),
          get(p, `/policies/v1/policies/${pol.id}/coverages`),
        ]);
        return {
          id: pol.id,
          policyNumber: pol.policyNumber,
          product: pol.product,
          status: pol.status,
          inForceToday: pol.status === 'active' && pol.effectiveDate <= today() && today() < pol.expirationDate,
          term: `${pol.effectiveDate} to ${pol.expirationDate}`,
          vehicles: (vehicles.data ?? vehicles).map((v: any) => ({ id: v.id, description: `${v.year} ${v.make} ${v.model}`, plate: v.licensePlate && `${v.licensePlate} (${v.licensePlateState})` })),
          coverages: (coverages.data ?? coverages).map(helpfulCoverage),
        };
      }),
    );
    return { customerId: cid, count: detailed.length, policies: detailed };
  },
});

async function pickPolicy(p: any, cid: string, lossDate: string, policyId?: string, vehicleId?: string) {
  if (policyId) {
    const pol = await get(p, `/policies/v1/policies/${policyId}`);
    if (pol.customerId !== cid) throw new ToolError(`Policy ${policyId} does not belong to this customer.`, 'Use list_policies to see your policies.');
    return { policy: pol };
  }
  const all = await getAll(p, '/policies/v1/policies', { customerId: cid });
  let candidates = all.filter((x) => x.status !== 'quoted' && x.effectiveDate <= lossDate && lossDate < x.expirationDate);
  if (vehicleId && candidates.length > 1) {
    const withVehicle = [];
    for (const c of candidates) if ((await get(p, `/policies/v1/policies/${c.id}/vehicles`)).data.some((v: any) => v.id === vehicleId)) withVehicle.push(c);
    candidates = withVehicle;
  }
  if (candidates.length === 1) return { policy: candidates[0] };
  return { candidates: (candidates.length ? candidates : all).map((c) => ({ id: c.id, product: c.product, status: c.status, term: `${c.effectiveDate} to ${c.expirationDate}` })) };
}

async function pickVehicle(p: any, policyId: string, vehicleId?: string) {
  const vehicles = (await get(p, `/policies/v1/policies/${policyId}/vehicles`)).data as any[];
  if (vehicleId) return { vehicleId, vehicles };
  if (vehicles.length === 1) return { vehicleId: vehicles[0].id, vehicles };
  return { vehicles };
}

const describeVehicles = (vs: any[]) => vs.map((v) => ({ id: v.id, description: `${v.year} ${v.make} ${v.model}`, plate: v.licensePlate }));

export const checkCoverage = defineTool({
  name: 'check_coverage',
  title: 'Check coverage for a loss',
  description:
    'Answers "would this be covered, and what would I pay?" without filing anything. Verifies the policy and vehicle on the loss date, returns the coverage, limit, and deductible, shows rental and towing benefits, and optionally estimates your out-of-pocket cost.',
  roles: [...ALL],
  input: {
    claimType,
    lossDate: z.string().describe('YYYY-MM-DD; defaults to today').optional(),
    policyId: z.string().optional().describe('Omit to use the customer\'s policy in force on the loss date'),
    vehicleId: z.string().optional(),
    estimatedRepairCost: z.number().positive().optional().describe('If known, estimates what the customer pays vs. what is covered'),
    customerId: z.string().optional().describe('Staff only'),
  },
  readOnly: true,
  handler: async (a, p) => {
    const cid = customerScope(p, a.customerId);
    if (!cid) throw new ToolError('customerId is required.');
    const lossDate = a.lossDate ?? today();
    const picked = await pickPolicy(p, cid, lossDate, a.policyId, a.vehicleId);
    if (!picked.policy) return { needsInput: 'policyId', message: 'Which policy? None or several were in force on that date.', policies: picked.candidates };
    const pol = picked.policy;
    const veh = await pickVehicle(p, pol.id, a.vehicleId);
    if (!veh.vehicleId) return { needsInput: 'vehicleId', message: 'Which vehicle?', vehicles: describeVehicles(veh.vehicles) };
    const v = await api(p, 'POST', `/policies/v1/policies/${pol.id}/coverage-verifications`, { body: { lossDate, claimType: a.claimType, vehicleId: veh.vehicleId } });
    const coverages = ((await get(p, `/policies/v1/policies/${pol.id}/coverages`)).data as any[]).map(helpfulCoverage);
    const extras = {
      rental: coverages.find((c) => c.code === 'RENT') ?? 'Not included: a rental car would be out of pocket.',
      towing: coverages.find((c) => c.code === 'TOW') ?? 'Not included: towing would be out of pocket unless the vehicle is covered by roadside elsewhere.',
    };
    const out: Record<string, unknown> = {
      policyId: pol.id,
      vehicleId: veh.vehicleId,
      lossDate,
      covered: v.covered,
      coverage: v.coverage ? helpfulCoverage(v.coverage) : undefined,
      reasons: v.reasons,
      extras,
    };
    if (v.covered && v.coverage && a.estimatedRepairCost) {
      const ded = v.coverage.deductible?.amount ?? 0;
      const cap = v.coverage.limit?.amount ?? Infinity;
      const covered = Math.max(0, Math.min(a.estimatedRepairCost, cap) - ded);
      out.estimate = { repairCost: usd(a.estimatedRepairCost), youPay: usd(a.estimatedRepairCost - covered), vandelayPays: usd(covered), because: `deductible ${usd(ded)}${cap < a.estimatedRepairCost ? `, coverage limit ${usd(cap)}` : ''}` };
    }
    out.summary = v.covered
      ? `Covered under ${v.coverage?.name ?? 'your policy'}${v.coverage?.deductible ? ` with a ${usd(v.coverage.deductible.amount)} deductible` : ''}.`
      : `Not covered: ${v.reasons.map((r: any) => r.message).join(' ')}`;
    return out;
  },
});

export const fileClaim = defineTool({
  name: 'file_claim',
  title: 'File a claim',
  description:
    'Guided claim intake. Finds the right policy and vehicle (or asks which), verifies coverage, blocks duplicates, creates the claim (submitted unless saveAsDraft), then returns the deductible, safety guidance, and suggested nearby in-network tow/repair/glass vendors. Safe to retry: the same details never create two claims. If it needs more information it returns `needsInput` instead of guessing.',
  roles: [...ALL],
  input: {
    type: claimType,
    lossDate: z.string().describe('YYYY-MM-DD, not in the future'),
    description: z.string().min(10).max(4000).describe('What happened, in the customer\'s words'),
    policyId: z.string().optional(),
    vehicleId: z.string().optional(),
    lossLocation: addressSchema.optional(),
    drivable: z.boolean().optional().describe('Can the vehicle be driven?'),
    injuries: z.boolean().optional().describe('Was anyone injured?'),
    policeReportNumber: z.string().optional(),
    saveAsDraft: z.boolean().default(false).describe('Save without submitting'),
    customerId: z.string().optional().describe('Staff only: file on behalf of this customer'),
  },
  idempotent: true,
  handler: async (a, p) => {
    const cid = customerScope(p, a.customerId);
    if (!cid) throw new ToolError('customerId is required when filing as staff.');
    if (a.lossDate > today()) throw new ToolError('The loss date cannot be in the future.');
    const picked = await pickPolicy(p, cid, a.lossDate, a.policyId, a.vehicleId);
    if (!picked.policy) return { created: false, needsInput: 'policyId', message: 'Which policy should this claim go on?', policies: picked.candidates };
    const pol = picked.policy;
    const veh = await pickVehicle(p, pol.id, a.vehicleId);
    if (!veh.vehicleId) return { created: false, needsInput: 'vehicleId', message: 'Which vehicle was involved?', vehicles: describeVehicles(veh.vehicles) };

    const v = await api(p, 'POST', `/policies/v1/policies/${pol.id}/coverage-verifications`, { body: { lossDate: a.lossDate, claimType: a.type, vehicleId: veh.vehicleId } });
    if (!v.covered) {
      return {
        created: false,
        covered: false,
        reasons: v.reasons,
        message: `This loss is not covered: ${v.reasons.map((r: any) => r.message).join(' ')}`,
        whatNext: 'No claim was created. Use list_policies to try another policy, or claims_help(topic="coverage"). A supervisor can review exceptions.',
      };
    }
    const existing = (await getAll(p, '/claims/v1/claims', { policyId: pol.id }, 3)).find(
      (c) => c.vehicleId === veh.vehicleId && c.type === a.type && c.lossDate === a.lossDate && c.status !== 'cancelled',
    );
    if (existing) {
      return { created: false, duplicateOf: existing.id, message: `A ${a.type} claim for this loss already exists (${existing.id}, ${existing.status}).`, whatNext: 'Use get_claim_status to follow it, or add_note to add information.' };
    }

    const body = {
      customerId: cid,
      policyId: pol.id,
      vehicleId: veh.vehicleId,
      type: a.type,
      lossDate: a.lossDate,
      description: a.description,
      ...(a.lossLocation ? { lossLocation: a.lossLocation } : {}),
      ...(a.drivable !== undefined ? { drivable: a.drivable } : {}),
      ...(a.injuries !== undefined ? { injuries: a.injuries } : {}),
      ...(a.policeReportNumber ? { policeReportNumber: a.policeReportNumber } : {}),
      submit: !a.saveAsDraft,
    };
    const claim = await api(p, 'POST', '/claims/v1/claims', { body, idempotencyKey: `mcp-file-${stable(body)}` });

    const safety: string[] = [];
    if (a.injuries) safety.push('If anyone still needs medical attention, call 911. Injury claims are prioritised and an adjuster will contact you first.');
    if (a.type === 'theft' && !a.policeReportNumber) safety.push('File a police report for the theft and add the report number with add_note; it is required before payment.');
    if (a.type === 'vandalism' && !a.policeReportNumber) safety.push('Filing a police report for vandalism speeds up review.');
    if (daysBetween(a.lossDate, today()) > LATE_REPORT_DAYS) safety.push(`This was reported more than ${LATE_REPORT_DAYS} days after the loss, so the adjuster may ask for additional documentation.`);

    const postal = a.lossLocation?.postalCode ?? (await claimPostalCode(p, claim));
    const suggestions: Record<string, unknown> = {};
    if (postal && !a.saveAsDraft) {
      if (a.drivable === false) suggestions.tow = await rankVendors(p, { type: 'tow', postalCode: postal, limit: 3 });
      suggestions[a.type === 'glass' ? 'glass' : 'repair'] = await rankVendors(p, { type: a.type === 'glass' ? 'glass' : 'repair', postalCode: postal, limit: 3 });
    }
    const coverage = helpfulCoverage(v.coverage);
    return {
      created: true,
      claimId: claim.id,
      status: claim.status,
      coverage,
      deductible: claim.deductible,
      summary: `Claim ${claim.id} ${claim.status === 'draft' ? 'saved as a draft' : 'submitted'}. Covered under ${coverage?.name ?? 'your policy'}; you pay the first ${usd(claim.deductible?.amount)} of an approved repair.`,
      lossLocation: addr(a.lossLocation),
      safetyAndDocuments: safety,
      suggestedVendors: suggestions,
      nextSteps:
        claim.status === 'draft'
          ? ['Review, then submit_claim to send it to an adjuster.']
          : [
              'An adjuster will be assigned and will review; you can follow progress with get_claim_status.',
              ...(a.drivable === false ? ['Your vehicle is not drivable: book a tow with request_service(serviceType="tow") using one of the suggested vendors.'] : []),
              'Choose a repair shop from the suggestions with request_service(serviceType="repair"), or ask for more options with find_vendors.',
            ],
    };
  },
});

export const submitClaim = defineTool({
  name: 'submit_claim',
  title: 'Submit a draft claim',
  description: 'Submits a draft claim to the claims team. Optionally corrects the description first. Only draft claims can be submitted.',
  roles: [...ALL],
  input: { claimId, description: z.string().min(10).optional().describe('Updated description of the loss') },
  idempotent: true,
  handler: async ({ claimId: id, description }, p) => {
    const claim = await getAccessibleClaim(p, id);
    if (claim.status !== 'draft') throw new ToolError(`Claim ${id} is ${claim.status}, not a draft.`, 'Only draft claims can be submitted. Use get_claim_status to see where it stands.');
    const updated = await api(p, 'PATCH', `/claims/v1/claims/${id}`, { body: { status: 'submitted', ...(description ? { description } : {}) } });
    return { claimId: id, status: updated.status, message: 'Submitted. An adjuster will be assigned and will review it.' };
  },
});

export const listClaims = defineTool({
  name: 'list_claims',
  title: 'List claims',
  description: 'Lists claims with a one-line plain-language status each, newest first. Customers and agents see only the customer\'s own claims; staff can filter by customer, policy, or status.',
  roles: [...ALL],
  input: {
    status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'denied', 'settled', 'closed', 'cancelled']).optional(),
    openOnly: z.boolean().optional().describe('Only claims that are not settled, closed, denied, or cancelled'),
    customerId: z.string().optional().describe('Staff only'),
    policyId: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  },
  readOnly: true,
  handler: async (a, p) => {
    const cid = customerScope(p, a.customerId);
    if (!cid && !isStaff(p)) throw new ToolError('customerId is required.');
    const page = await get(p, '/claims/v1/claims', { customerId: cid, status: a.status, policyId: a.policyId, limit: 100 });
    let rows: any[] = page.data;
    if (a.openOnly) rows = rows.filter((c) => ['draft', 'submitted', 'under_review', 'approved'].includes(c.status));
    rows = rows.slice(0, a.limit);
    return {
      count: rows.length,
      hasMore: !!page.nextCursor,
      claims: rows.map((c) => ({
        claimId: c.id,
        status: c.status,
        type: c.type,
        lossDate: c.lossDate,
        estimate: c.estimatedAmount ?? null,
        deductible: c.deductible,
        ...(isCustomerAudience(p) ? {} : { customerId: c.customerId, assignedAdjusterId: c.assignedAdjusterId ?? null }),
        updatedAt: c.updatedAt,
      })),
    };
  },
});

export const getClaimStatus = defineTool({
  name: 'get_claim_status',
  title: 'Get claim status',
  description:
    'One-stop claim status: where it stands in plain language, your deductible and the approved amount, how much has been paid and what remains, vendors and their schedule, payments, recent notes and timeline, and the recommended next steps. Customers and agents never see internal notes; staff do.',
  roles: [...ALL],
  input: { claimId },
  readOnly: true,
  handler: async ({ claimId: id }, p) => statusView(p, await fetchBundle(p, await getAccessibleClaim(p, id))),
});

export const addNote = defineTool({
  name: 'add_note',
  title: 'Add a note to a claim',
  description:
    'Adds a note to the claim. Customers and agents write customer-visible notes (a message to the adjuster, extra details, a police report number). Staff default to internal notes; set visibility="customer" to message the customer.',
  roles: [...ALL],
  input: {
    claimId,
    body: z.string().min(1).max(4000),
    visibility: z.enum(['internal', 'customer']).optional().describe('Staff only. Defaults to internal for staff, customer for everyone else.'),
  },
  handler: async ({ claimId: id, body, visibility }, p) => {
    const claim = await getAccessibleClaim(p, id);
    const vis = isStaff(p) ? (visibility ?? 'internal') : 'customer';
    const note = await api(p, 'POST', `/claims/v1/claims/${claim.id}/notes`, { body: { body, visibility: vis } });
    return { noteId: note.id, claimId: claim.id, visibility: vis, createdAt: note.createdAt, message: vis === 'customer' ? 'Added. Your adjuster will see it.' : 'Internal note added (not visible to the customer).' };
  },
});

export const findVendors = defineTool({
  name: 'find_vendors',
  title: 'Find vendors',
  description:
    'Finds eligible in-network tow, repair, rental, glass, or appraisal vendors near the loss (or any postal code), ranked by distance then rating. Only active, in-network vendors that serve the area are returned: exactly those that can be assigned to a claim.',
  roles: [...ALL],
  input: {
    type: z.enum(['repair', 'tow', 'rental', 'glass', 'appraisal']),
    claimId: claimId.optional().describe('Search near this claim\'s loss location'),
    postalCode: z.string().optional().describe('Search near this postal code instead (e.g. 28202)'),
    radiusMiles: z.number().int().min(1).max(100).default(25),
    limit: z.number().int().min(1).max(10).default(5),
  },
  readOnly: true,
  handler: async (a, p) => {
    let postal = a.postalCode;
    if (a.claimId) postal = postal ?? (await claimPostalCode(p, await getAccessibleClaim(p, a.claimId)));
    if (!postal) throw new ToolError('Provide a claimId or a postalCode to search near.');
    const vendors = await rankVendors(p, { type: a.type, postalCode: postal, radiusMiles: a.radiusMiles, limit: a.limit });
    return {
      searchedNear: postal,
      type: a.type,
      count: vendors.length,
      vendors,
      note: vendors.length ? 'Book one with request_service.' : 'No eligible in-network vendors in range. Try a larger radiusMiles or a nearby postal code.',
    };
  },
});

export const requestService = defineTool({
  name: 'request_service',
  title: 'Book a tow, repair, rental, or glass service',
  description:
    'Books a vendor for the claim. Without vendorId it picks the best eligible in-network vendor (nearest, then best rated). Checks the claim is open, avoids double-booking the same service, and warns when the policy lacks towing or rental coverage. Use dryRun to preview the choice without booking.',
  roles: [...ALL],
  input: {
    claimId,
    serviceType: z.enum(['tow', 'repair', 'rental', 'glass', 'appraisal']).describe('appraisal is for staff only'),
    vendorId: z.string().optional().describe('A vendor from find_vendors; omit to auto-select'),
    scheduledFor: z.string().optional().describe('ISO date-time with offset, e.g. 2026-10-22T09:00:00-04:00'),
    instructions: z.string().max(1000).optional(),
    acknowledgeOutOfPocket: z.boolean().default(false).describe('Confirm the customer will pay for a service the policy does not cover'),
    dryRun: z.boolean().default(false),
  },
  handler: async (a, p) => {
    const claim = await getAccessibleClaim(p, a.claimId);
    if (a.serviceType === 'appraisal' && !isStaff(p)) throw new ToolError('Appraisals are arranged by your adjuster.', 'Ask them with add_note.');
    if (!['submitted', 'under_review', 'approved'].includes(claim.status)) {
      throw new ToolError(`Claim ${claim.id} is ${claim.status}; services can only be booked on submitted, under-review, or approved claims.`);
    }
    const assignments = (await get(p, `/claims/v1/claims/${claim.id}/assignments`)).data as any[];
    const active = assignments.find((x) => x.role === a.serviceType && ['requested', 'accepted', 'in_progress'].includes(x.status));
    if (active) return { booked: false, alreadyArranged: active, message: `A ${a.serviceType} service is already ${active.status} on this claim (${active.id}).` };

    const coverageCode = { tow: 'TOW', rental: 'RENT' }[a.serviceType as string];
    if (coverageCode && !a.acknowledgeOutOfPocket) {
      const cov = ((await tryGet(p, `/policies/v1/policies/${claim.policyId}/coverages`))?.data as any[] | undefined) ?? [];
      if (!cov.some((c) => c.code === coverageCode)) {
        return {
          booked: false,
          coverageWarning: `Policy ${claim.policyId} does not include ${a.serviceType === 'tow' ? 'towing' : 'rental reimbursement'} coverage, so this would be out of pocket.`,
          whatNext: 'Call again with acknowledgeOutOfPocket=true to book anyway.',
        };
      }
    }
    const postal = await claimPostalCode(p, claim);
    if (!postal) throw new ToolError('Cannot determine where to search: the claim has no loss location and the customer has no address.');
    let vendor: { id: string; name: string } | undefined;
    if (a.vendorId) vendor = { id: a.vendorId, name: a.vendorId };
    else {
      const ranked = await rankVendors(p, { type: a.serviceType, postalCode: postal, limit: 1 });
      if (!ranked.length) return { booked: false, message: `No eligible in-network ${a.serviceType} vendor serves ${postal}.`, whatNext: 'Try find_vendors with a larger radius, or ask your adjuster.' };
      vendor = ranked[0];
      if (a.dryRun) return { booked: false, dryRun: true, wouldBook: ranked[0] };
    }
    if (a.dryRun) return { booked: false, dryRun: true, wouldBook: vendor };
    const asg = await api(p, 'POST', `/claims/v1/claims/${claim.id}/assignments`, {
      body: { vendorId: vendor.id, role: a.serviceType, ...(a.scheduledFor ? { scheduledFor: a.scheduledFor } : {}), ...(a.instructions ? { instructions: a.instructions } : {}) },
    });
    return {
      booked: true,
      assignmentId: asg.id,
      vendor,
      serviceType: a.serviceType,
      status: asg.status,
      scheduledFor: asg.scheduledFor ?? null,
      message: `${vendor.name} has been requested for ${a.serviceType}. They will confirm; check get_claim_status for updates.`,
    };
  },
});

export const listPayoutMethods = defineTool({
  name: 'list_payout_methods',
  title: 'List payout methods',
  description: 'Lists the bank accounts or debit cards on file for receiving claim payments (only the last four digits are ever shown).',
  roles: [...ALL],
  input: { payeeId: z.string().optional().describe('Staff only: customer or vendor ID. Defaults to the customer.') },
  readOnly: true,
  handler: async ({ payeeId }, p) => {
    const id = isStaff(p) ? (payeeId ?? undefined) : customerScope(p);
    if (!id) throw new ToolError('payeeId is required.');
    const r = await get(p, '/payments/v1/payment-methods', { payeeId: id });
    return { payeeId: id, methods: r.data, hasDefault: r.data.some((m: any) => m.isDefault) };
  },
});

export const addPayoutMethod = defineTool({
  name: 'add_payout_method',
  title: 'Add a payout method',
  description:
    'Adds a bank account or debit card for receiving payments. Takes a single-use token from Vandelay\'s hosted payment form (tok_bank_... or tok_card_...), never a raw account or card number. Never ask for or accept full account numbers in chat.',
  roles: ['customer', 'adjuster', 'supervisor'],
  input: {
    type: z.enum(['bank_account', 'debit_card']),
    token: z.string().describe('Single-use token from the hosted payment form'),
    makeDefault: z.boolean().default(true),
    payeeId: z.string().optional().describe('Staff only: customer or vendor ID. Defaults to the customer.'),
  },
  handler: async (a, p) => {
    const id = isStaff(p) ? a.payeeId : customerScope(p);
    if (!id) throw new ToolError('payeeId is required.');
    if (/^\d{9,19}$/.test(a.token.replace(/[\s-]/g, ''))) throw new ToolError('That looks like a raw account or card number. Do not share it; use the hosted form to get a token.');
    const pm = await api(p, 'POST', '/payments/v1/payment-methods', { body: { payeeId: id, type: a.type, token: a.token, isDefault: a.makeDefault } });
    return { methodId: pm.id, label: pm.label, isDefault: pm.isDefault, message: `${pm.label} added${pm.isDefault ? ' and set as default' : ''}.` };
  },
});

export const cancelClaim = defineTool({
  name: 'cancel_claim',
  title: 'Cancel a claim',
  description:
    'Cancels a claim. First call (confirm=false) shows exactly what will be cancelled; nothing changes until you call again with confirm=true. Customers can cancel until the claim is approved. Cancelling also cancels open vendor jobs and unpaid payments; completed payments are not reversed.',
  roles: [...ALL],
  input: {
    claimId,
    reason: z.enum(['customer_request', 'duplicate', 'fraud_suspected', 'policy_issue', 'other']).default('customer_request').describe('Customers and agents can only use customer_request or duplicate'),
    comment: z.string().max(1000).optional(),
    confirm: z.boolean().default(false),
  },
  destructive: true,
  handler: async (a, p) => {
    const claim = await getAccessibleClaim(p, a.claimId);
    if (isCustomerAudience(p)) {
      if (!['customer_request', 'duplicate'].includes(a.reason)) throw new ToolError('You can cancel with the reason customer_request or duplicate.');
      if (!['draft', 'submitted', 'under_review'].includes(claim.status)) {
        throw new ToolError(`Claim ${claim.id} is ${claim.status}; it can only be cancelled by your adjuster now.`, 'Add a note asking to cancel with add_note, or call your adjuster.');
      }
    }
    if (['settled', 'closed', 'cancelled', 'denied'].includes(claim.status)) throw new ToolError(`Claim ${claim.id} is already ${claim.status} and cannot be cancelled.`);
    const [assignments, payments] = await Promise.all([
      get(p, `/claims/v1/claims/${claim.id}/assignments`).then((r) => r.data as any[]),
      getAll(p, '/payments/v1/payments', { claimId: claim.id }),
    ]);
    const willCancel = {
      vendorJobs: assignments.filter((x) => ['requested', 'accepted', 'in_progress'].includes(x.status)).map((x) => `${x.role} (${x.id})`),
      unpaidPayments: payments.filter((x) => ['pending_approval', 'processing'].includes(x.status)).map((x) => `${x.id} ${usd(x.amount.amount)}`),
    };
    const keep = payments.filter((x) => x.status === 'completed').map((x) => `${x.id} ${usd(x.amount.amount)}`);
    if (!a.confirm) {
      return {
        cancelled: false,
        confirmationRequired: true,
        willCancel,
        paymentsAlreadyCompleted: keep,
        message: `This will cancel claim ${claim.id}${willCancel.vendorJobs.length ? ' and its vendor jobs' : ''}. Call again with confirm=true to proceed.`,
      };
    }
    const done = await api(p, 'POST', `/claims/v1/claims/${claim.id}/cancel`, { body: { reason: a.reason, ...(a.comment ? { comment: a.comment } : {}) } });
    return { cancelled: true, claimId: done.id, status: done.status, cancelledVendorJobs: willCancel.vendorJobs, cancelledPayments: willCancel.unpaidPayments, paymentsAlreadyCompleted: keep };
  },
});

export const customerTools = [
  whoami, claimsHelp, listPolicies, checkCoverage, fileClaim, submitClaim, listClaims, getClaimStatus, addNote,
  findVendors, requestService, listPayoutMethods, addPayoutMethod, cancelClaim,
];
