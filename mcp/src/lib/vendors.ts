import type { Principal } from './auth';
import { ApiProblem, get, tryGet } from './upstream';

export type VendorType = 'repair' | 'tow' | 'rental' | 'glass' | 'appraisal';

/** Postal code a claim's vendors should serve: the loss location, else the customer's home address. */
export async function claimPostalCode(p: Principal, claim: any): Promise<string | undefined> {
  if (claim.lossLocation?.postalCode) return claim.lossLocation.postalCode;
  const c = await tryGet(p, `/customers/v1/customers/${claim.customerId}`);
  return c?.address?.postalCode;
}

/**
 * Eligible vendors ranked the way an adjuster would pick: active and in-network first (the Claims API requires both
 * for assignments), then nearest, then best rated.
 */
export async function rankVendors(p: Principal, o: { type: VendorType; postalCode: string; radiusMiles?: number; limit?: number }) {
  let data: any[];
  try {
    data = (await get(p, '/vendors/v1/vendors', { type: o.type, postalCode: o.postalCode, radiusMiles: o.radiusMiles ?? 25, inNetwork: true, limit: 50 })).data;
  } catch (e) {
    if (e instanceof ApiProblem && e.status === 400) return [];
    throw e;
  }
  return data
    .filter((v) => v.status === 'active' && v.inNetwork && (!v.serviceAreaPostalCodes || v.serviceAreaPostalCodes.includes(o.postalCode)))
    .sort((a, b) => (a.distanceMiles ?? 1e9) - (b.distanceMiles ?? 1e9) || (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, o.limit ?? 5)
    .map((v) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      distanceMiles: v.distanceMiles,
      rating: v.rating,
      phone: v.phone,
      address: v.address ? `${v.address.addressLine1}, ${v.address.city}, ${v.address.state} ${v.address.postalCode}` : undefined,
    }));
}
