/**
 * Ownership rules. The Vandelay APIs authenticate a token but do not check that a customer owns the claim they
 * ask for, so the MCP layer does: customers (and agents acting for one) can only reach their own records.
 */
import type { Principal } from './auth';
import { isStaff } from './auth';
import { ToolError } from './kit';
import { ApiProblem, get } from './upstream';

/** The customer a call is scoped to: the caller (customers), the bound customer (agents), or the requested one (staff). */
export function customerScope(p: Principal, requested?: string): string | undefined {
  if (isStaff(p)) return requested;
  if (!p.customerId) {
    throw new ToolError(
      'This agent session is not bound to a customer.',
      'Reconnect with the header "X-On-Behalf-Of: <customerId>" so the agent acts for exactly one customer.',
    );
  }
  if (requested && requested !== p.customerId) throw new ToolError('You can only access your own account.');
  return p.customerId;
}

const CLAIM_NOT_FOUND = (id: string) => new ToolError(`No claim ${id} was found.`, 'Use list_claims to see the claims you can access.');

/** Fetches a claim and enforces ownership. A claim someone else owns looks exactly like one that does not exist. */
export async function getAccessibleClaim(p: Principal, claimId: string): Promise<any> {
  let claim: any;
  try {
    claim = await get(p, `/claims/v1/claims/${encodeURIComponent(claimId)}`);
  } catch (e) {
    if (e instanceof ApiProblem && e.status === 404) throw CLAIM_NOT_FOUND(claimId);
    throw e;
  }
  if (!isStaff(p) && claim.customerId !== customerScope(p)) throw CLAIM_NOT_FOUND(claimId);
  return claim;
}

export function requireRole(p: Principal, ...roles: Principal['role'][]) {
  if (!roles.includes(p.role)) throw new ToolError(`This action requires the ${roles.join(' or ')} role.`);
}
