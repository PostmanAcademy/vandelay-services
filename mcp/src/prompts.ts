/** Prompts and a resource that teach a client how to use the tools well, by role. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Principal } from './lib/auth';
import { HELP } from './lib/guidance';
import { ADJUSTER_APPROVAL_LIMIT, PAYMENT_APPROVAL_THRESHOLD } from './lib/config';
import { usd } from './lib/format';

const user = (text: string) => ({ messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }] });

export function registerPromptsAndResources(server: McpServer, p: Principal) {
  server.registerResource(
    'claims-process',
    'vandelay://claims-process',
    { title: 'How Vandelay claims work', description: 'The claim lifecycle, rules, and thresholds these tools enforce.', mimeType: 'text/markdown' },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: [
            '# Vandelay claims process',
            '',
            '**Lifecycle:** draft -> submitted -> under_review -> approved | denied -> settled (automatic once fully paid). A claim can be cancelled until it is settled.',
            '',
            '**Money:** approved amount = estimate - deductible. Payments cannot exceed it. ' +
              `Payments to customers over ${usd(PAYMENT_APPROVAL_THRESHOLD.customer)} and to vendors over ${usd(PAYMENT_APPROVAL_THRESHOLD.vendor)} wait for a second person to approve.`,
            '',
            `**Authority:** adjusters approve up to ${usd(ADJUSTER_APPROVAL_LIMIT)}; above that, or when the risk screen is HIGH, a supervisor decides and records an override reason.`,
            '',
            ...Object.values(HELP).flatMap((h) => [`## ${h.title}`, ...h.body.map((l) => `- ${l}`), '']),
          ].join('\n'),
        },
      ],
    }),
  );

  if (p.role === 'customer' || p.role === 'agent') {
    server.registerPrompt(
      'file_a_claim',
      { title: 'File a claim', description: 'Walk a customer through reporting a loss.', argsSchema: { whatHappened: z.string().optional() } },
      ({ whatHappened }) =>
        user(
          `Help the customer file an insurance claim${whatHappened ? `: "${whatHappened}"` : ''}. ` +
            'First check for injuries and safety (call 911 if needed). Gather the date, location, whether the vehicle is drivable, and any police report number. ' +
            'Use list_policies and check_coverage to confirm what applies and the deductible, then file_claim. If the vehicle is not drivable, offer a tow with request_service. ' +
            'Finish by explaining next steps in plain language. Never ask for full card or account numbers.',
        ),
    );
    server.registerPrompt('my_claim_update', { title: 'Where is my claim?', description: 'Explain the customer\'s open claims and what to do next.' }, () =>
      user('Use list_claims(openOnly=true) and get_claim_status to explain, in plain language, where each of my claims stands, what has been paid, and exactly what I need to do next.'),
    );
  }

  if (p.role === 'adjuster' || p.role === 'supervisor') {
    server.registerPrompt('daily_triage', { title: 'Daily triage', description: 'Work the queue top-down.' }, () =>
      user(
        'Run my daily triage. Call claims_worklist, then for the top claims call claim_dossier. For each, recommend the next action and call it when it is within my authority: ' +
          'start_claim_review for new intake, set_estimate/decide_claim for reviewed claims (always preview with confirm=false first), request_service for missing vendors, issue_payment for approved balances. Summarise what you did and what needs a supervisor.',
      ),
    );
    server.registerPrompt('closeout_sweep', { title: 'Close-out sweep', description: 'Find settled claims ready to close.' }, () =>
      user('List settled claims with list_claims(status="settled"), run closeout_claim on each, report blockers with the action that clears them, and finalize the ones that are ready.'),
    );
  }

  if (p.role === 'supervisor') {
    server.registerPrompt('approvals_review', { title: 'Approvals review', description: 'Review everything waiting for a supervisor.' }, () =>
      user(
        'Review what is waiting for me. Call list_pending_approvals, then for each payment read the context, risk flags, and creator. Approve (approve_payment) those that are clean and that I am allowed to approve, ' +
          'and recommend cancelling or investigating the rest. Also look at claims_worklist for items marked "needs supervisor approval" and for [ESCALATION] notes. Never approve a high-risk item without stating the override reason.',
      ),
    );
  }
}
