# Vandelay Claims MCP server

An [MCP](https://modelcontextprotocol.io) server for the whole claim lifecycle (open, manage, close) on top of the five Vandelay APIs.
It is not a 1:1 wrapper: each tool joins several APIs and adds the business logic an adjuster or a customer-service agent would otherwise do by hand.

- **Transport:** Streamable HTTP, stateless, at `POST /mcp`. Health at `GET /health`.
- **Who can use it:** customers, AI agents (internal or external), claims adjusters, and claims supervisors. The server shows each caller only the tools their role may use (`tools/list` is role-filtered).
- **Stack:** Bun + Hono + `@modelcontextprotocol/sdk`. No database; all state lives in the Vandelay APIs.

## Authentication and roles

A caller sends `Authorization: Bearer <token>` using one of the four Vandelay persona tokens (the same ones the APIs accept; see the root README).
The server recognises the token from its own `API_TOKEN_*` environment variables, **forwards the same token to the APIs**, and so inherits their scope checks (an agent still gets `403` on payments, PII is masked without `customers:pii:read`, customers never see internal notes).
On top of that the MCP layer adds what the APIs do not do:

| Persona | Role | Sees | Notes |
| --- | --- | --- | --- |
| `API_TOKEN_CUSTOMER` | customer | 14 tools | Only their own policies and claims. A claim they do not own looks like it does not exist. |
| `API_TOKEN_AGENT` | agent | 13 tools | Customer tools, scoped to **one customer** declared by the header `X-On-Behalf-Of: cus_...`. Customer-safe views only. No payout-method changes, no payments. Without the header it can only get help and search vendors. |
| `API_TOKEN_ADJUSTER` | adjuster | 25 tools | Everything customers can do for anyone, plus the queue, review, decisions within authority, vendors, and payments. |
| `API_TOKEN_SUPERVISOR` | supervisor | 27 tools | Adjuster tools plus payment approval, the approvals queue, and documented overrides. |

> The persona tokens are shared demo credentials, so "customer" always means Marisol Vega (`cus_01HX9K`). In production, replace them with per-user OAuth tokens and a signed delegation for agents instead of the `X-On-Behalf-Of` header.

## Tools

**Everyone:** `whoami`, `claims_help` (topics, plus personalised next steps for a claim), `list_policies`, `check_coverage` (covered? deductible? rental/tow benefits? out-of-pocket estimate), `file_claim`, `submit_claim`, `list_claims`, `get_claim_status`, `add_note`, `find_vendors`, `request_service`, `list_payout_methods`, `cancel_claim`.
**Customers and staff:** `add_payout_method`.
**Staff:** `claims_worklist`, `claim_dossier`, `assess_claim_risk`, `start_claim_review`, `set_estimate`, `decide_claim`, `issue_payment`, `cancel_payment`, `refund_payment`, `update_vendor_work`, `closeout_claim`.
**Supervisors:** `list_pending_approvals`, `approve_payment`.

### What the tools add beyond the APIs

| Tool | Logic on top of the API calls |
| --- | --- |
| `file_claim` | Picks the policy in force on the loss date and the vehicle (or returns `needsInput` with the choices), verifies coverage first and explains a decline without creating anything, blocks duplicates, derives an idempotency key so retries never double-file, then adds safety guidance (injuries, theft without a police report, late reporting) and suggests nearby tow/repair/glass vendors. |
| `check_coverage` | "Would this be covered and what would I pay?" with deductible, limit, rental and tow benefits, and an out-of-pocket estimate. Files nothing. |
| `get_claim_status` | One call joins claim, policy, vendors, payments, refunds, notes and timeline into plain-language status, the money picture (approved / paid / remaining), and next steps. Customers get a customer-safe view. |
| `request_service` | Auto-picks the best eligible vendor (active, in-network, serves the loss ZIP, nearest then best rated), refuses to double-book, and warns when the policy lacks tow or rental coverage. |
| `cancel_claim` | Shows exactly which vendor jobs and payments would be cancelled and requires `confirm=true`. Customers can cancel only before approval. |
| `claims_worklist` | Priority-ranks the queue (injuries, undrivable, unassigned, age, stalled, approved-but-unpaid) and says why and what to do next. |
| `claim_dossier` / `assess_claim_risk` | 360 view plus a transparent risk screen (suspended customer, coverage re-check, late report, early-in-term loss, claim frequency, repeat loss on the same vehicle, theft/injury without a police report, estimate over limit). Every flag says why it fired. |
| `start_claim_review` | Assigns, sets the first estimate, moves to review, runs the risk screen, and writes an auto-triage note plus a customer-visible update. |
| `decide_claim` | Approved amount = estimate - deductible. **Authority:** adjusters cannot approve above `ADJUSTER_APPROVAL_LIMIT` (default $15,000) or a HIGH-risk claim; the claim is escalated with a note. Supervisors can, and on a HIGH-risk claim must record an `overrideReason`. Denials require a customer-facing explanation. Reasoning is written to the file. |
| `issue_payment` | Defaults to the remaining balance, uses the payee's default payout method, blocks overpayment, duplicate invoices and look-alike duplicate payments, previews whether supervisor approval will be needed, and moves money only with `confirm=true`. |
| `approve_payment` | Four-eyes: you cannot approve a payment you created (checked against the claim timeline). Previews full context and risk before approving. |
| `closeout_claim` | Lists blockers (open vendor jobs, payments in flight, unpaid balance, unpaid completed vendor work, unanswered customer message) and the action that clears each; `finalize=true` writes the closing notes. |

Money-moving and destructive tools default to a **preview** and act only with `confirm=true`. Prompts (`file_a_claim`, `my_claim_update`, `daily_triage`, `closeout_sweep`, `approvals_review`) and the resource `vandelay://claims-process` teach clients the workflows.

## Run locally

```bash
cd mcp && bun install
# Start the Vandelay APIs first (see the root README), then:
export API_TOKEN_AGENT=... API_TOKEN_ADJUSTER=... API_TOKEN_SUPERVISOR=... API_TOKEN_CUSTOMER=...   # same values as the APIs
VANDELAY_API_URL=http://localhost:8080 PORT=8090 bun run dev     # MCP endpoint: http://localhost:8090/mcp
```

Connect a client, for example Claude Code:

```bash
claude mcp add --transport http vandelay-claims http://localhost:8090/mcp --header "Authorization: Bearer $API_TOKEN_ADJUSTER"
```

In Postman, create an MCP request to the same URL with the header `Authorization: Bearer <token>`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_TOKEN_AGENT`, `_ADJUSTER`, `_SUPERVISOR`, `_CUSTOMER` | at least one required | Persona tokens (min 24 chars); must match the APIs' |
| `VANDELAY_API_URL` | `http://localhost:8080` | Host of the deployed Vandelay APIs |
| `ADJUSTER_APPROVAL_LIMIT` | `15000` | Largest approved amount an adjuster may approve alone |
| `PORT`, `APP_ENV` | `8090` (`8080` in the image), `development` | |

## Test

```bash
# APIs running with ADMIN_TOKEN set, MCP server running, and the API_TOKEN_* variables exported:
cd mcp && bun test            # MCP_URL defaults to http://localhost:8090/mcp
```

The suite resets the APIs' database, then drives the server with a real MCP client as each persona: role-filtered tool lists, ownership isolation, the agent binding, a customer journey (coverage check, filing, duplicates, draft, notes, services, cancel) and the staff journey (queue, review, approval, payment, settlement, close-out), plus authority limits, four-eyes approval, and risk flags.

## Deploy to AWS

After `deploy/aws/deploy.sh` has created the APIs:

```bash
AWS_PROFILE=<profile> ./deploy/aws/deploy-mcp.sh
```

This builds `mcp/` into an ECR repository `vandelay-mcp` and creates App Runner services `vandelay-mcp-prod` and `vandelay-mcp-test` (0.25 vCPU / 0.5 GB, public HTTPS, no database), each pointing at the matching API service and reading the same persona-token secrets. It prints the `/mcp` URLs. `deploy/aws/teardown.sh --yes` removes them with everything else.

Demo limits to know: all MCP users of a persona share that persona's API rate limit (600 requests/minute per token) and a tool call fans out to several API calls; the WAF's per-IP limit also counts the MCP service as one client.

## Known gaps

- The Claims API has no transition to `closed` (it only reaches `settled`, `denied`, or `cancelled`), so `closeout_claim` records closing notes but cannot change the status.
- Customer ownership and risk rules are enforced here, not in the APIs; calling the APIs directly with the customer token can still read other customers' claims.
- Sessions are stateless: no server-initiated notifications or resumable streams.
