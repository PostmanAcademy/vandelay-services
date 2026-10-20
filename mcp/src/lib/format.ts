export const CURRENCY = 'USD';
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const money = (amount: number) => ({ amount: round2(amount), currency: CURRENCY });
export const usd = (n: number | undefined | null) =>
  n === undefined || n === null ? 'n/a' : n.toLocaleString('en-US', { style: 'currency', currency: CURRENCY });
export const today = () => new Date().toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.floor((Date.parse(b) - Date.parse(a)) / 86_400_000);
export const ageDays = (iso: string) => Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));
export const addr = (a?: { addressLine1?: string; city?: string; state?: string; postalCode?: string }) =>
  a ? `${a.addressLine1 ?? ''}, ${a.city ?? ''}, ${a.state ?? ''} ${a.postalCode ?? ''}`.replace(/^, /, '') : undefined;
