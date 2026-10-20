/**
 * End-to-end tests: a real MCP client talks to the MCP server, which talks to the live Vandelay APIs.
 * Needs the APIs (with ADMIN_TOKEN for reset) and the MCP server running, and the API_TOKEN_* variables exported.
 */
import { beforeAll, describe, expect, test } from 'bun:test';
import { connect, caller, resetDb, MCP_URL, TOKENS } from './helpers';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MARISOL = { customerId: 'cus_01HX9K', policyId: 'pol_AUT-882145', vehicleId: 'veh_7731' };

let customer: ReturnType<typeof caller>, agent: ReturnType<typeof caller>, adjuster: ReturnType<typeof caller>, supervisor: ReturnType<typeof caller>;

beforeAll(async () => {
  await resetDb();
  customer = caller(await connect('customer'));
  adjuster = caller(await connect('adjuster'));
  supervisor = caller(await connect('supervisor'));
  agent = caller(await connect('agent', { 'X-On-Behalf-Of': MARISOL.customerId }));
});

/** Files a claim as the customer and returns its ID. */
async function newClaim(lossDate: string, type = 'collision', extra: Record<string, unknown> = {}) {
  const r = await customer('file_claim', { type, lossDate, description: `Test ${type} loss on ${lossDate}, details for the adjuster.`, drivable: true, injuries: false, ...extra });
  expect(r.isError).toBe(false);
  expect(r.data.created).toBe(true);
  return r.data.claimId as string;
}

describe('connection and access', () => {
  test('rejects missing and bad tokens', async () => {
    for (const auth of [undefined, 'Bearer nope']) {
      const r = await fetch(MCP_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(auth ? { Authorization: auth } : {}) }, body: '{}' });
      expect(r.status).toBe(401);
    }
  });

  test('each role sees only its tools', async () => {
    const names = async (p: any) => (await (await connect(p)).listTools()).tools.map((t) => t.name);
    const [c, a, s, ag] = await Promise.all([names('customer'), names('adjuster'), names('supervisor'), names('agent')]);
    expect(c).toContain('file_claim');
    for (const staffOnly of ['claim_dossier', 'decide_claim', 'issue_payment', 'approve_payment']) expect(c).not.toContain(staffOnly);
    expect(ag).not.toContain('add_payout_method');
    expect(a).toContain('issue_payment');
    expect(a).not.toContain('approve_payment');
    expect(s).toContain('approve_payment');
    expect(s).toContain('list_pending_approvals');
  });

  test('every tool declares annotations', async () => {
    const tools = (await (await connect('supervisor')).listTools()).tools;
    for (const t of tools) expect(t.annotations?.readOnlyHint !== undefined).toBe(true);
  });

  test('customers cannot see anyone else\'s claim, and it looks like it does not exist', async () => {
    const others = (await adjuster('list_claims', { limit: 50 })).data.claims.filter((c: any) => c.customerId !== MARISOL.customerId);
    expect(others.length).toBeGreaterThan(0);
    const r = await customer('get_claim_status', { claimId: others[0].claimId });
    expect(r.isError).toBe(true);
    expect(r.data.error).toContain('No claim');
    expect((await customer('list_claims', {})).data.claims.every((c: any) => c.status)).toBe(true);
    const mine = await customer('list_claims', { limit: 50 });
    expect(mine.data.claims.length).toBeGreaterThan(0);
    expect((await customer('list_policies', { customerId: 'cus_other' })).isError).toBe(true);
  });

  test('an unbound agent can only do general things; a bound agent is limited to its customer and customer-safe views', async () => {
    const unbound = caller(await connect('agent'));
    expect((await unbound('claims_help', {})).isError).toBe(false);
    const r = await unbound('list_claims', {});
    expect(r.isError).toBe(true);
    expect(r.data.hint).toContain('X-On-Behalf-Of');
    const status = await agent('get_claim_status', { claimId: 'clm_2026-000417' });
    expect(status.isError).toBe(false);
    expect(JSON.stringify(status.data)).not.toContain('"internal"');
    expect((await agent('list_claims', { customerId: 'cus_someoneelse' })).isError).toBe(true);
  });
});

describe('customer journey', () => {
  test('claims_help gives guidance and personalised next steps', async () => {
    const r = await customer('claims_help', { topic: 'deductible', claimId: 'clm_2026-000417' });
    expect(r.data.guidance.join(' ')).toContain('deductible');
    expect(r.data.yourClaim.status).toBe('approved');
  });

  test('check_coverage explains coverage, extras, and out-of-pocket cost', async () => {
    const r = await customer('check_coverage', { claimType: 'collision', lossDate: '2026-10-10', estimatedRepairCost: 3000 });
    expect(r.isError).toBe(false);
    expect(r.data.covered).toBe(true);
    expect(r.data.estimate.youPay).toBeDefined();
    expect(r.data.extras).toBeDefined();
  });

  test('file_claim declines uncovered losses without creating anything', async () => {
    const r = await customer('file_claim', { type: 'collision', lossDate: '2020-01-01', description: 'Long ago accident, should not be covered.' });
    expect(r.data.created).toBe(false);
  });

  test('file_claim creates a claim with deductible, guidance and vendor suggestions, and refuses duplicates', async () => {
    const r = await customer('file_claim', {
      type: 'collision', lossDate: '2026-10-11', description: 'Hit a guard rail on I-77 near uptown; front end damaged.',
      drivable: false, injuries: true, lossLocation: { addressLine1: '100 N Tryon St', city: 'Charlotte', state: 'NC', postalCode: '28202', country: 'US' },
    });
    expect(r.data.created).toBe(true);
    expect(r.data.status).toBe('submitted');
    expect(r.data.deductible.amount).toBeGreaterThanOrEqual(0);
    expect(r.data.safetyAndDocuments.join(' ')).toContain('911');
    expect(r.data.suggestedVendors.tow.length).toBeGreaterThan(0);
    const dup = await customer('file_claim', { type: 'collision', lossDate: '2026-10-11', description: 'Hit a guard rail on I-77 near uptown; front end damaged.' });
    expect(dup.data.created).toBe(false);
    expect(dup.data.duplicateOf).toBe(r.data.claimId);
  });

  test('draft -> submit, notes (customers can never write internal notes), and service booking', async () => {
    const draft = await customer('file_claim', { type: 'weather', lossDate: '2026-10-09', description: 'Hail damage to hood and roof overnight.', saveAsDraft: true });
    expect(draft.data.status).toBe('draft');
    const id = draft.data.claimId;
    expect((await customer('request_service', { claimId: id, serviceType: 'repair' })).isError).toBe(true);
    expect((await customer('submit_claim', { claimId: id })).data.status).toBe('submitted');
    expect((await customer('submit_claim', { claimId: id })).isError).toBe(true);
    const note = await customer('add_note', { claimId: id, body: 'Please call after 5pm.', visibility: 'internal' });
    expect(note.data.visibility).toBe('customer');
    const preview = await customer('request_service', { claimId: id, serviceType: 'repair', dryRun: true });
    expect(preview.data.wouldBook.id).toBeDefined();
    const booked = await customer('request_service', { claimId: id, serviceType: 'repair' });
    expect(booked.data.booked).toBe(true);
    expect((await customer('request_service', { claimId: id, serviceType: 'repair' })).data.alreadyArranged).toBeDefined();
    expect((await customer('request_service', { claimId: id, serviceType: 'appraisal' })).isError).toBe(true);
  });

  test('cancel_claim previews, then cancels only on confirm; customers cannot cancel approved claims', async () => {
    const id = await newClaim('2026-10-08', 'vandalism');
    const preview = await customer('cancel_claim', { claimId: id });
    expect(preview.data.confirmationRequired).toBe(true);
    expect((await customer('get_claim_status', { claimId: id })).data.status).toBe('submitted');
    const done = await customer('cancel_claim', { claimId: id, confirm: true });
    expect(done.data.status).toBe('cancelled');
    expect((await customer('cancel_claim', { claimId: 'clm_2026-000417', confirm: true })).isError).toBe(true);
    expect((await customer('cancel_claim', { claimId: id, reason: 'fraud_suspected' })).isError).toBe(true);
  });

  test('customers never see internal notes or risk, agents neither', async () => {
    const id = await newClaim('2026-10-07', 'glass');
    await adjuster('add_note', { claimId: id, body: 'INTERNAL-ONLY-SECRET reasoning' });
    for (const who of [customer, agent]) {
      const r = await who('get_claim_status', { claimId: id });
      expect(JSON.stringify(r.data)).not.toContain('INTERNAL-ONLY-SECRET');
      expect(r.data.risk).toBeUndefined();
    }
    expect(JSON.stringify((await adjuster('claim_dossier', { claimId: id })).data)).toContain('INTERNAL-ONLY-SECRET');
  });
});

describe('adjuster and supervisor', () => {
  test('full lifecycle: intake -> review -> approve -> pay -> settle -> close-out', async () => {
    const id = await newClaim('2026-10-06', 'collision');
    const queue = (await adjuster('claims_worklist', { limit: 50 })).data.queue;
    expect(queue.find((q: any) => q.claimId === id)?.next).toBe('start_claim_review');

    expect((await adjuster('decide_claim', { claimId: id, decision: 'approve', rationale: 'Too early to approve this.' })).isError).toBe(true);
    const review = await adjuster('start_claim_review', { claimId: id, estimate: 2500 });
    expect(review.data.status).toBe('under_review');
    expect(review.data.risk.level).toBeDefined();

    const dossier = (await adjuster('claim_dossier', { claimId: id })).data;
    expect(dossier.authority.youCanApprove).toBe(true);
    expect(dossier.customer.piiVisible).toBe(true);
    expect(JSON.stringify(dossier.allNotes)).toContain('Auto-triage');

    const preview = await adjuster('decide_claim', { claimId: id, decision: 'approve', rationale: 'Damage matches photos and police report.' });
    expect(preview.data.confirmationRequired).toBe(true);
    expect((await adjuster('get_claim_status', { claimId: id })).data.status).toBe('under_review');
    const approved = await adjuster('decide_claim', { claimId: id, decision: 'approve', rationale: 'Damage matches photos and police report.', confirm: true });
    expect(approved.data.decided).toBe(true);
    const customerView = (await customer('get_claim_status', { claimId: id })).data;
    expect(customerView.status).toBe('approved');
    expect(customerView.notes.map((n: any) => n.body).join(' ')).toContain('approved');

    const notYet = await adjuster('closeout_claim', { claimId: id });
    expect(notYet.data.readyToClose).toBe(false);

    const pv = await adjuster('issue_payment', { claimId: id });
    expect(pv.data.confirmationRequired).toBe(true);
    expect(pv.data.preview.amount.amount).toBe(2500 - dossier.deductible.amount);
    expect(pv.data.preview.willSettleClaim).toBe(true);
    const paid = await adjuster('issue_payment', { claimId: id, confirm: true, requestId: `t-${id}` });
    expect(paid.data.paid).toBe(true);
    const retry = await adjuster('issue_payment', { claimId: id, confirm: true, requestId: `t-${id}` });
    expect(retry.isError).toBe(true);
    expect((await adjuster('issue_payment', { claimId: id, confirm: true, amount: 1, allowDuplicate: true })).isError).toBe(true);

    await sleep(8000);
    expect((await adjuster('get_claim_status', { claimId: id })).data.status).toBe('settled');
    const ready = await adjuster('closeout_claim', { claimId: id, finalize: true });
    expect(ready.data.readyToClose).toBe(true);
    expect(ready.data.finalized).toBe(true);
    const cust = (await customer('get_claim_status', { claimId: id })).data;
    expect(cust.notes.map((n: any) => n.body).join(' ')).toContain('complete');
  }, 30000);

  test('authority limit: adjusters escalate big approvals, supervisors approve; four-eyes on large payments', async () => {
    const id = await newClaim('2026-10-05', 'collision');
    await adjuster('start_claim_review', { claimId: id });
    await adjuster('set_estimate', { claimId: id, estimate: 30000, basis: 'Total loss appraisal' });
    const blocked = await adjuster('decide_claim', { claimId: id, decision: 'approve', rationale: 'Total loss per appraisal.', confirm: true });
    expect(blocked.data.escalated).toBe(true);
    expect((await adjuster('get_claim_status', { claimId: id })).data.status).toBe('under_review');
    expect(JSON.stringify((await supervisor('claim_dossier', { claimId: id })).data.allNotes)).toContain('[ESCALATION');

    const ok = await supervisor('decide_claim', { claimId: id, decision: 'approve', rationale: 'Total loss confirmed by appraisal.', confirm: true });
    expect(ok.data.decided).toBe(true);

    const big = await adjuster('issue_payment', { claimId: id, amount: 12000, confirm: true });
    expect(big.data.status).toBe('pending_approval');
    const queue = await supervisor('list_pending_approvals', {});
    const row = queue.data.payments.find((x: any) => x.paymentId === big.data.paymentId);
    expect(row.youCanApprove).toBe(true);
    expect(row.createdBy).toBe('adj_220');
    expect((await supervisor('approve_payment', { paymentId: big.data.paymentId, comment: 'Verified payee and amount' })).data.confirmationRequired).toBe(true);
    const done = await supervisor('approve_payment', { paymentId: big.data.paymentId, comment: 'Verified payee and amount', confirm: true });
    expect(done.data.status).toBe('processing');

    const own = await supervisor('issue_payment', { claimId: id, amount: 11000, confirm: true });
    expect(own.data.warning ?? own.data.preview?.warning).toBeDefined();
    const selfApprove = await supervisor('approve_payment', { paymentId: own.data.paymentId, comment: 'Trying to approve my own', confirm: true });
    expect(selfApprove.isError).toBe(true);
    expect(selfApprove.data.error).toContain('cannot approve');
    expect((await supervisor('cancel_payment', { paymentId: own.data.paymentId, reason: 'other' })).data.status).toBe('cancelled');
  }, 30000);

  test('risk screen flags a theft without a police report; denial needs an explanation and reaches the customer', async () => {
    const id = await newClaim('2026-09-01', 'theft', { description: 'Car stolen from a parking garage overnight.', drivable: false });
    const risk = await adjuster('assess_claim_risk', { claimId: id });
    expect(risk.data.flags.map((f: any) => f.code)).toContain('THEFT_NO_POLICE_REPORT');
    expect(risk.data.flags.map((f: any) => f.code)).toContain('LATE_REPORT');
    await adjuster('start_claim_review', { claimId: id });
    expect((await adjuster('decide_claim', { claimId: id, decision: 'deny', rationale: 'No police report provided.' })).isError).toBe(true);
    const denied = await adjuster('decide_claim', {
      claimId: id, decision: 'deny', rationale: 'No police report after two requests.', confirm: true,
      customerExplanation: 'We could not verify the theft because no police report was provided.',
    });
    expect(denied.data.status).toBe('denied');
    const v = (await customer('get_claim_status', { claimId: id })).data;
    expect(v.status).toBe('denied');
    expect(JSON.stringify(v.notes)).toContain('police report');
  });

  test('adjusters cannot do supervisor things; agents cannot reach payments at all', async () => {
    expect((await connect('adjuster').then((c) => c.callTool({ name: 'approve_payment', arguments: { paymentId: 'pay_1', comment: 'xxxxx' } }))).isError).toBe(true);
    expect((await connect('agent', { 'X-On-Behalf-Of': MARISOL.customerId }).then((c) => c.callTool({ name: 'issue_payment', arguments: {} }))).isError).toBe(true);
  });
});
