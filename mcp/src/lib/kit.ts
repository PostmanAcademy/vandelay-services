/** Tool plumbing: definitions, role-filtered registration, uniform success/error results. */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShape } from 'zod';
import type { Principal, Role } from './auth';
import { ApiProblem } from './upstream';

/** A business-rule or access refusal raised by tool logic (as opposed to an API error). */
export class ToolError extends Error {
  constructor(message: string, public hint?: string, public details?: Record<string, unknown>) {
    super(message);
  }
}

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  /** Roles that can see and call the tool. Others never see it in `tools/list`. */
  roles: Role[];
  input: ZodRawShape;
  readOnly?: boolean;
  /** Moves money, cancels work, or otherwise cannot be undone. */
  destructive?: boolean;
  idempotent?: boolean;
  handler: (args: any, p: Principal) => Promise<Record<string, unknown>>;
}

export const defineTool = (t: ToolDef) => t;

const HINTS: Record<string, string> = {
  'policy-not-active': 'Use list_policies to find a policy that was in force on the loss date, or claims_help(topic="coverage").',
  'coverage-not-included': 'The policy does not carry the coverage this loss type needs. check_coverage shows what the policy does cover.',
  'vehicle-not-on-policy': 'Use list_policies to see which vehicles each policy insures.',
  'duplicate-claim': 'A claim for this loss already exists. Use list_claims / get_claim_status instead of filing again.',
  'vendor-not-eligible': 'Use find_vendors to see eligible vendors for this claim (active, in-network, serving the loss location).',
  'claim-not-approved': 'Payments are only possible on approved claims. Check get_claim_status.',
  'exceeds-approved-amount': 'The claim balance is smaller than the requested amount. Omit `amount` to pay the remaining balance.',
  'duplicate-invoice': 'That vendor invoice was already paid. Check the claim\'s payments before paying again.',
  'invalid-payment-method': 'The payee has no matching payout method. Use list_payout_methods / add_payout_method.',
  forbidden: 'Your role is not allowed to do this. A supervisor can, or ask them via an internal note.',
  'rate-limited': 'Wait for the Retry-After period and retry.',
};

export function failure(e: unknown): CallToolResult {
  let body: Record<string, unknown>;
  if (e instanceof ToolError) {
    body = { error: e.message, ...(e.hint ? { hint: e.hint } : {}), ...(e.details ?? {}) };
  } else if (e instanceof ApiProblem) {
    const slug = e.problem.type?.split('/').pop() ?? '';
    body = {
      error: e.problem.detail ?? e.problem.title ?? `HTTP ${e.status}`,
      status: e.status,
      problem: e.problem.title,
      ...(e.problem.errors?.length ? { fieldErrors: e.problem.errors } : {}),
      ...(HINTS[slug] ? { hint: HINTS[slug] } : e.status === 403 ? { hint: HINTS.forbidden } : {}),
      ...(e.problem.traceId ? { traceId: e.problem.traceId } : {}),
    };
  } else {
    console.error('[tool] unexpected error', e);
    body = { error: 'Unexpected error while running the tool.', hint: 'Retry; if it persists, contact the API platform team.' };
  }
  return { isError: true, content: [{ type: 'text', text: JSON.stringify(body, null, 2) }], structuredContent: body };
}

export function success(data: Record<string, unknown>): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data };
}

/** Registers only the tools the principal's role may use. */
export function registerTools(server: McpServer, p: Principal, tools: ToolDef[]) {
  for (const t of tools) {
    if (!t.roles.includes(p.role)) continue;
    server.registerTool(
      t.name,
      {
        title: t.title,
        description: t.description,
        inputSchema: t.input,
        annotations: {
          readOnlyHint: !!t.readOnly,
          destructiveHint: !t.readOnly && !!t.destructive,
          idempotentHint: !!t.readOnly || !!t.idempotent,
          openWorldHint: false,
        },
      },
      async (args: any) => {
        const started = performance.now();
        try {
          const out = await t.handler(args, p);
          console.log(`[tool] ${t.name} role=${p.role} sub=${p.sub} ok ${Math.round(performance.now() - started)}ms`);
          return success(out);
        } catch (e) {
          console.log(`[tool] ${t.name} role=${p.role} sub=${p.sub} error ${Math.round(performance.now() - started)}ms`);
          return failure(e);
        }
      },
    );
  }
}
