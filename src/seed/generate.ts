/**
 * Deterministic seed-data generator for the Vandelay APIs.
 *
 * Produces one integrated book of business as of AS_OF: customers and their households, vehicles,
 * policy terms (renewals, lapses, cancellations, quotes) with coverages and drivers, a vendor
 * network, and claims whose full lifecycle is simulated: first notice of loss, coverage
 * verification, towing, adjuster review, appraisal, repair, rental, approval, payments, refunds,
 * settlement, and closure. Every record references real records in the other APIs.
 *
 * The same seed always produces the same data, so Prod and Test start from an identical baseline.
 */
import * as R from './reference';
import type { Metro, CatalogVehicle } from './reference';

export const AS_OF = new Date('2026-10-19T15:00:00Z');
const AS_OF_DATE = '2026-10-19';

export type Row = Record<string, any>;
export interface Dataset {
  postal_codes: Row[];
  adjusters: Row[];
  customers: Row[];
  vehicles: Row[];
  policies: Row[];
  policy_coverages: Row[];
  policy_vehicles: Row[];
  drivers: Row[];
  vendors: Row[];
  claims: Row[];
  coverage_verifications: Row[];
  claim_notes: Row[];
  claim_events: Row[];
  work_orders: Row[];
  payment_methods: Row[];
  payments: Row[];
  refunds: Row[];
  sequences: Record<string, number>;
}

// ---- Deterministic randomness -------------------------------------------------------------------

let state = 0;
function reseed(s: number) {
  state = s >>> 0;
}
function rand(): number {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
function pick(arr: string): string;
function pick<T>(arr: readonly T[]): T;
function pick(arr: any) {
  return arr[Math.floor(rand() * arr.length)];
}
const chance = (p: number) => rand() < p;
function weighted<T>(pairs: readonly [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of pairs) if ((r -= w) < 0) return v;
  return pairs[pairs.length - 1][0];
}
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const round2 = (n: number) => Math.round(n * 100) / 100;
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

// ---- Dates --------------------------------------------------------------------------------------

const DAY = 86_400_000;
const HOUR = 3_600_000;
const D = (s: string) => new Date(`${s}T00:00:00Z`);
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => ymd(new Date(D(s).getTime() + n * DAY));
function addMonths(s: string, n: number) {
  const d = D(s);
  d.setUTCMonth(d.getUTCMonth() + n);
  return ymd(d);
}
const daysBetween = (a: string, b: string) => Math.round((D(b).getTime() - D(a).getTime()) / DAY);
const randDate = (a: string, b: string) => addDays(a, int(0, Math.max(0, daysBetween(a, b))));
/** Hours behind UTC for US Eastern time (approximate DST: March-October). */
const ptOffset = (s: string) => {
  const m = Number(s.slice(5, 7));
  return m >= 3 && m <= 10 ? 4 : 5;
};
const at = (s: string, ptHour: number, min = int(0, 59), sec = int(0, 59)) =>
  new Date(D(s).getTime() + ((ptHour + ptOffset(s)) * 3600 + min * 60 + sec) * 1000);
const plusH = (d: Date, h: number) => new Date(d.getTime() + h * HOUR);
const plusMin = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);
/** Advances `h` hours, then moves into local business hours (8am-6pm Eastern). */
function bizAfter(d: Date, hMin: number, hMax: number): Date {
  const t = new Date(d.getTime() + (hMin + rand() * (hMax - hMin)) * HOUR);
  const day = ymd(new Date(t.getTime() - ptOffset(ymd(t)) * HOUR));
  const ptHour = (t.getUTCHours() - ptOffset(day) + 24) % 24;
  if (ptHour < 8) return at(day, int(8, 10));
  if (ptHour >= 18) return at(addDays(day, 1), int(8, 10));
  return t;
}
/** Local wall-clock ISO string with the Eastern offset, e.g. 2026-10-07T09:00:00-04:00. */
const localIso = (s: string, hour: number) => `${s}T${String(hour).padStart(2, '0')}:00:00-0${ptOffset(s)}:00`;
const ptDate = (d: Date) => ymd(new Date(d.getTime() - ptOffset(ymd(d)) * HOUR));

// ---- Helpers ------------------------------------------------------------------------------------

const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
const VIN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY123456789';

/** Generates a structurally valid 17-character VIN (correct model-year code and check digit). */
function makeVin(wmi: string, year: number): string {
  const vds = Array.from({ length: 5 }, () => pick(VIN_CHARS)).join('');
  const yearCode = YEAR_CODES[(year - 1980) % 30];
  const plant = pick('ABCDEFGHKLMNPRSTUVWXYZ0123456789');
  const serial = String(int(0, 999999)).padStart(6, '0');
  const vin = `${wmi}${vds}0${yearCode}${plant}${serial}`;
  const sum = [...vin].reduce((s, ch, i) => s + (/\d/.test(ch) ? Number(ch) : VIN_VALUES[ch]) * VIN_WEIGHTS[i], 0);
  const r = sum % 11;
  return vin.slice(0, 8) + (r === 10 ? 'X' : String(r)) + vin.slice(9);
}

const PLATE_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
function makePlate(state: string, year: number, kind: string): string {
  const L = () => pick(PLATE_LETTERS);
  const d = () => String(int(0, 9));
  const moto = kind === 'moto';
  switch (state) {
    case 'NC': return moto ? `${L()}${L()}${d()}${d()}${d()}${d()}` : `${L()}${L()}${L()}${d()}${d()}${d()}${d()}`;
    case 'SC': return moto ? `${d()}${d()}${d()}${d()}${L()}${L()}` : `${L()}${L()}${L()}${d()}${d()}${d()}`;
    case 'FL': return moto ? `${d()}${d()}${L()}${L()}${d()}${d()}` : `${L()}${L()}${L()}${L()}${d()}${d()}`;
    default: return moto ? `${d()}${L()}${L()}${d()}${d()}${d()}` : `${L()}${L()}${L()}${d()}${d()}${d()}${d()}`;
  }
}

function licenseNumber(state: string): string {
  if (state === 'FL') return pick('ABCDEFGHJKLMNPRSTVWZ') + String(int(100000000000, 999999999999));
  if (state === 'NC') return String(int(10000000, 999999999999));
  return String(int(100000000, 999999999));
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// ---- Coverages ----------------------------------------------------------------------------------

const COVERAGE_ORDER = ['COLL', 'COMP', 'GLASS', 'BI', 'PD', 'CSL', 'UM', 'MED', 'RENT', 'TOW', 'ACC'];
const COVERAGE_NAMES: Record<string, string> = {
  COLL: 'Collision', COMP: 'Comprehensive', GLASS: 'Full Glass', BI: 'Bodily Injury Liability', PD: 'Property Damage Liability',
  CSL: 'Combined Single Limit Liability', UM: 'Uninsured Motorist Bodily Injury', MED: 'Medical Payments', RENT: 'Rental Reimbursement',
  TOW: 'Towing & Labor', ACC: 'Custom Parts & Equipment',
};
interface Cov { code: string; limit?: number; deductible?: number; daily?: number }

interface CoveragePlan {
  tier: 'full' | 'liability';
  bi: number;
  pd: number;
  um?: number;
  med: number;
  collDed: number;
  compDed: number;
  rent?: [number, number];
  tow?: number;
  glass: boolean;
}

function coveragePlan(newestValue: number, state: string): CoveragePlan {
  const tier = newestValue < 9000 && chance(0.7) ? 'liability' : 'full';
  const lim = weighted<[number, number]>([[[25000, 25000], 2], [[50000, 50000], 3], [[100000, 50000], 4], [[250000, 100000], 2]]);
  return {
    tier,
    bi: lim[0],
    pd: lim[1],
    um: tier === 'liability' && chance(0.5) ? undefined : lim[0],
    med: pick([1000, 5000, 5000, 10000]),
    collDed: weighted([[500, 5], [1000, 3], [250, 1]]),
    compDed: weighted([[250, 4], [500, 4], [100, 1]]),
    rent: chance(0.6) ? weighted<[number, number]>([[[900, 30], 3], [[1200, 40], 4], [[1500, 50], 2]]) : undefined,
    tow: chance(0.4) ? pick([100, 200]) : undefined,
    // Florida requires zero-deductible windshield coverage on comprehensive policies.
    glass: chance(state === 'FL' ? 0.9 : 0.2),
  };
}

function coveragesFor(product: string, plan: CoveragePlan, maxValue: number, agreedValue?: number): Cov[] {
  const physLimit = agreedValue ?? (maxValue > 45000 ? 100000 : maxValue > 30000 ? 75000 : 50000);
  const out: Cov[] = [];
  if (product === 'commercial_auto') {
    out.push({ code: 'CSL', limit: 1000000 }, { code: 'UM', limit: 100000 }, { code: 'MED', limit: 5000 });
    out.push({ code: 'COLL', limit: 75000, deductible: 1000 }, { code: 'COMP', limit: 75000, deductible: 500 }, { code: 'RENT', limit: 1800, daily: 60 }, { code: 'TOW', limit: 250 });
    return out;
  }
  out.push({ code: 'BI', limit: plan.bi }, { code: 'PD', limit: plan.pd });
  if (plan.um) out.push({ code: 'UM', limit: plan.um });
  out.push({ code: 'MED', limit: plan.med });
  if (product === 'motorcycle') {
    out.push({ code: 'COLL', limit: physLimit, deductible: 500 }, { code: 'COMP', limit: physLimit, deductible: 250 }, { code: 'ACC', limit: 3000, deductible: 250 });
    return out;
  }
  if (product === 'classic_car') {
    out.push({ code: 'COLL', limit: physLimit, deductible: 250 }, { code: 'COMP', limit: physLimit, deductible: 0 }, { code: 'TOW', limit: 500 });
    return out;
  }
  if (plan.tier === 'full') {
    out.push({ code: 'COLL', limit: physLimit, deductible: plan.collDed }, { code: 'COMP', limit: physLimit, deductible: plan.compDed });
    if (plan.glass) out.push({ code: 'GLASS', deductible: 0 });
    if (plan.rent) out.push({ code: 'RENT', limit: plan.rent[0], daily: plan.rent[1] });
    if (plan.tow) out.push({ code: 'TOW', limit: plan.tow });
  }
  return out;
}

// ---- Model types --------------------------------------------------------------------------------

interface Person { first: string; last: string; dob: string; license: string; state: string; relationship: 'self' | 'spouse' | 'child' | 'other' }

type Archetype = 'standard' | 'moto' | 'classic' | 'commercial' | 'lapsed' | 'cancelled' | 'expired' | 'quoted' | 'suspended';

interface Household {
  customer: Row;
  metro: Metro;
  zip: R.Zip;
  street: string;
  archetype: Archetype;
  people: Person[];
  cars: VehicleRec[];
  special: VehicleRec[];
  plan: CoveragePlan;
  claimCount: number;
}

interface VehicleRec { row: Row; kind: string; catalog: CatalogVehicle }

interface PolicyRec {
  row: Row;
  hh: Household;
  vehicles: VehicleRec[];
  coverages: Row[];
  drivers: Row[];
  /** Coverage ends on this date (exclusive): lapse/cancel date or expiration. */
  end: string;
}

// ---- Generator ----------------------------------------------------------------------------------

export function generate(): Dataset {
  reseed(20261019);
  const ds: Dataset = {
    postal_codes: [], adjusters: [], customers: [], vehicles: [], policies: [], policy_coverages: [], policy_vehicles: [], drivers: [],
    vendors: [], claims: [], coverage_verifications: [], claim_notes: [], claim_events: [], work_orders: [], payment_methods: [],
    payments: [], refunds: [], sequences: {},
  };

  ds.postal_codes = R.ZIPS.map((z) => ({ postal_code: z.zip, city: z.city, state: z.state, metro: z.metro, latitude: z.lat, longitude: z.lon }));
  ds.adjusters = R.ADJUSTERS.map((a) => ({ ...a }));

  // ---- Vendors ----
  const miles = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
    const rad = Math.PI / 180;
    const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(h));
  };
  const vendorMetro = new Map<string, Metro>();
  for (const v of R.VENDORS) {
    const zi = R.zipInfo(v.zip);
    vendorMetro.set(v.id, zi.metro);
    const lat = zi.lat + (rand() - 0.5) * 0.006;
    const lon = zi.lon + (rand() - 0.5) * 0.006;
    const serviceArea = v.serviceArea ?? R.ZIPS.filter((x) => x.metro === zi.metro && miles({ lat, lon }, x) <= R.SERVICE_RADIUS[v.type]).map((x) => x.zip);
    const created = new Date(v.createdAt);
    ds.vendors.push({
      id: v.id, name: v.name, type: v.type, tax_id: v.taxId, in_network: v.inNetwork, rating: v.rating ?? null, phone: v.phone, email: v.email,
      address_line1: v.line1, address_line2: null, city: zi.city, state: zi.state, postal_code: v.zip, country: 'US', latitude: lat, longitude: lon,
      service_area: serviceArea, status: v.status, created_at: created,
      updated_at: v.status === 'suspended' ? new Date('2026-08-21T17:42:00Z') : v.status === 'terminated' ? new Date('2025-11-03T19:05:00Z') : created,
    });
  }
  const vendorById = new Map(ds.vendors.map((v) => [v.id, v]));

  // Vendor payout accounts.
  let vendorPm = 8700;
  for (const v of ds.vendors) {
    if (v.status === 'pending') continue;
    let n = ++vendorPm;
    if (n === 8802) n = ++vendorPm;
    const id = v.id === 'ven_4417' ? 'pm_8802' : `pm_${n}`;
    const last4 = v.id === 'ven_4417' ? '1182' : String(int(1000, 9999));
    ds.payment_methods.push({
      id, payee_type: 'vendor', payee_id: v.id, type: 'bank_account', label: `Business checking ending in ${last4}`, last4,
      bank_name: v.id === 'ven_4417' ? 'First Example Bank' : pick(['First Example Bank', 'Piedmont Federal Credit Union', 'Palmetto Savings Bank', 'Volunteer State Bank']),
      is_default: true, token_hash: null, created_at: new Date(v.created_at.getTime() + 3 * DAY),
    });
  }
  const vendorPmId = (vendorId: string) => ds.payment_methods.find((p) => p.payee_id === vendorId)!.id;

  // ---- Customers, households, vehicles ----
  const usedIds = new Set<string>(['cus_01HX9K']);
  const usedNames = new Set<string>(['Marisol Vega']);
  const usedEmails = new Set<string>(['marisol.vega@example.com']);
  const usedPhones = new Set<string>(['+14155550142']);
  const usedVehicleIds = new Set<number>([7731]);
  const usedPolicyNumbers = new Set<string>(['AUT-882145']);
  let driverSeq = 1000;
  let customerPmSeq = 3200;

  const newCustomerId = () => {
    for (;;) {
      const id = 'cus_01' + Array.from({ length: 4 }, () => pick(CROCKFORD)).join('');
      if (!usedIds.has(id)) return usedIds.add(id), id;
    }
  };
  const newVehicleId = () => {
    for (;;) {
      const n = int(1000, 9899);
      if (!usedVehicleIds.has(n)) return usedVehicleIds.add(n), `veh_${n}`;
    }
  };
  const newPolicyNumber = (product: string, current: boolean) => {
    const prefix = { personal_auto: 'AUT', commercial_auto: 'COM', motorcycle: 'MCY', classic_car: 'CLS' }[product]!;
    const lead = product === 'personal_auto' ? (current ? pick(['8', '9']) : pick(['6', '7'])) : product === 'motorcycle' ? '4' : product === 'classic_car' ? '3' : '5';
    for (;;) {
      const num = `${prefix}-${lead}${String(int(0, 99999)).padStart(5, '0')}`;
      if (!usedPolicyNumbers.has(num)) return usedPolicyNumbers.add(num), num;
    }
  };
  const newPhone = (zip: R.Zip) => {
    for (;;) {
      const p = `+1${pick(zip.areaCodes)}55501${String(int(0, 99)).padStart(2, '0')}`;
      if (!usedPhones.has(p)) return usedPhones.add(p), p;
    }
  };
  const newEmail = (first: string, last: string) => {
    const f = first.toLowerCase().replace(/[^a-z]/g, '');
    const l = last.toLowerCase().replace(/[^a-z]/g, '');
    const options = [`${f}.${l}@example.com`, `${f[0]}${l}@example.net`, `${f}${l}${int(1, 99)}@example.org`, `${f}.${l}${int(10, 99)}@example.com`];
    for (const e of options) if (!usedEmails.has(e)) return usedEmails.add(e), e;
    return newEmail(first, last + int(1, 9));
  };

  function makeVehicle(customerId: string, kind: 'car' | 'moto' | 'classic' | 'commercial', state: string, maxYear = 2026): VehicleRec {
    const pool = R.VEHICLES.filter((x) => (kind === 'car' ? x.kind === 'car' || x.kind === 'truck' : x.kind === kind) && x.years[0] <= maxYear);
    const cat = pick(pool);
    const lo = kind === 'classic' ? cat.years[0] : Math.max(cat.years[0], 2010);
    const year = int(lo, Math.min(cat.years[1], maxYear));
    const age = 2026 - year;
    const value = kind === 'classic' ? roundTo(cat.msrp * (0.85 + rand() * 0.3), 500)
      : Math.max(kind === 'moto' ? 1500 : 3000, roundTo(cat.msrp * Math.pow(kind === 'moto' ? 0.88 : 0.86, age), 50));
    return {
      kind,
      catalog: cat,
      row: {
        id: newVehicleId(), customer_id: customerId, vin: makeVin(cat.wmi, year), year, make: cat.make, model: cat.model, trim: pick(cat.trims),
        color: weighted(R.COLORS), license_plate: makePlate(state, year, kind), license_plate_state: state, market_value: value, created_at: null,
      },
    };
  }

  // Households with special products are pinned to metros so every region has some; the rest are spread out.
  const pinned: [Archetype, Metro][] = [
    ['moto', 'KNX'], ['moto', 'KNX'], ['moto', 'AVL'], ['moto', 'AVL'], ['moto', 'CLT'], ['moto', 'MEM'],
    ['classic', 'CHS'], ['classic', 'CHS'], ['classic', 'CLT'], ['classic', 'GSP'], ['commercial', 'CLT'], ['commercial', 'JAX'], ['suspended', 'MEM'],
  ];
  const others: Archetype[] = shuffle([
    ...Array<Archetype>(41).fill('standard'), ...Array<Archetype>(5).fill('lapsed'), ...Array<Archetype>(4).fill('cancelled'),
    ...Array<Archetype>(4).fill('expired'), ...Array<Archetype>(3).fill('quoted'),
  ]);
  const remaining = Object.fromEntries(Object.entries(R.METRO_INFO).map(([m, info]) => [m, info.customers])) as Record<Metro, number>;
  for (const [, m] of pinned) remaining[m]--;
  const otherMetros = shuffle((Object.keys(remaining) as Metro[]).flatMap((m) => Array<Metro>(remaining[m]).fill(m)));
  const ARCHETYPES: Archetype[] = [...pinned.map(([a]) => a), ...others];
  const METROS: Metro[] = [...pinned.map(([, m]) => m), ...otherMetros];

  const households: Household[] = [];

  function makeHousehold(metro: Metro, archetype: Archetype): Household {
    const zip = pick(R.ZIPS.filter((x) => x.metro === metro && x.residential));
    let first: string, last: string, gender: 'F' | 'M';
    const groupWeights: [number, number][] = [[0, 38], [1, metro === 'JAX' || metro === 'MEM' ? 16 : 10], [2, 4], [3, 4], [4, 3], [5, 2], [6, 7], [7, metro === 'MEM' ? 34 : 22], [8, 5]];
    let group: (typeof R.NAME_GROUPS)[number];
    do {
      gender = chance(0.5) ? 'F' : 'M';
      group = R.NAME_GROUPS[weighted(groupWeights)];
      first = pick(gender === 'F' ? group.f : group.m);
      last = pick(chance(0.85) ? group.last : R.NAME_GROUPS[weighted(groupWeights)].last);
    } while (usedNames.has(`${first} ${last}`));
    const sameGroup = (g: 'f' | 'm') => pick(chance(0.8) ? group[g] : R.NAME_GROUPS[weighted(groupWeights)][g]);
    usedNames.add(`${first} ${last}`);
    const state = zip.state;
    const age = archetype === 'commercial' ? int(34, 58) : int(22, 74);
    const dob = randDate(`${2026 - age - 1}-10-20`, `${2026 - age}-10-18`);
    const people: Person[] = [{ first, last, dob, license: licenseNumber(state), state, relationship: 'self' }];
    if (age >= 26 && chance(0.4)) {
      const sAge = Math.max(21, age + int(-6, 6));
      people.push({ first: sameGroup(gender === 'F' ? 'm' : 'f'), last: chance(0.8) ? last : pick(group.last), dob: randDate(`${2026 - sAge - 1}-10-20`, `${2026 - sAge}-10-18`), license: licenseNumber(state), state, relationship: 'spouse' });
    }
    if (age >= 42 && chance(0.35)) {
      const cAge = int(16, 19);
      people.push({ first: sameGroup(chance(0.5) ? 'f' : 'm'), last, dob: randDate(`${2026 - cAge - 1}-10-20`, `${2026 - cAge}-10-18`), license: licenseNumber(state), state, relationship: 'child' });
    }
    if (archetype === 'commercial') {
      people.push({ first: sameGroup('m'), last: pick(R.NAME_GROUPS[weighted(groupWeights)].last), dob: randDate('1975-01-01', '1999-12-31'), license: licenseNumber(state), state, relationship: 'other' });
    }

    const [lang, p] = R.LANGUAGE_BY_LAST[last] ?? ['en', 0];
    const id = newCustomerId();
    const customer: Row = {
      id, first_name: first, last_name: last, email: newEmail(first, last), phone: newPhone(zip), date_of_birth: dob,
      address_line1: `${int(100, 4999)} ${pick(zip.streets)}`, address_line2: chance(0.25) ? pick(['Apt 2', 'Apt 3B', 'Unit 12', 'Apt 401', '#5', 'Unit C']) : null,
      city: zip.city, state, postal_code: zip.zip, country: 'US', status: 'active',
      contact_method: weighted([['sms', 40], ['email', 35], ['app', 15], ['phone', 10]]), language: chance(p) ? lang : 'en',
      marketing_opt_in: chance(0.3), created_at: null, updated_at: null,
    };
    const street = customer.address_line1.replace(/^\d+ /, '');

    const cars: VehicleRec[] = [];
    const special: VehicleRec[] = [];
    if (archetype === 'commercial') {
      special.push(makeVehicle(id, 'commercial', state), makeVehicle(id, 'commercial', state));
    } else {
      const n = weighted([[1, 60], [2, 30], [3, 10]]);
      for (let i = 0; i < n; i++) cars.push(makeVehicle(id, 'car', state));
      if (archetype === 'moto') special.push(makeVehicle(id, 'moto', state));
      if (archetype === 'classic') special.push(makeVehicle(id, 'classic', state));
    }
    const newest = Math.max(0, ...cars.map((c) => c.row.market_value));
    const hh: Household = { customer, metro, zip, street, archetype, people, cars, special, plan: coveragePlan(newest, state), claimCount: 0 };
    households.push(hh);
    return hh;
  }

  // Marisol Vega: the household every spec example refers to.
  const marisolZip = R.zipInfo('28202');
  const marisol: Household = {
    customer: {
      id: 'cus_01HX9K', first_name: 'Marisol', last_name: 'Vega', email: 'marisol.vega@example.com', phone: '+14155550142', date_of_birth: '1988-06-21',
      address_line1: '129 W Trade St', address_line2: 'Apt 5A', city: 'Charlotte', state: 'NC', postal_code: '28202', country: 'US', status: 'active',
      contact_method: 'sms', language: 'en', marketing_opt_in: false, created_at: new Date('2024-03-14T16:02:11Z'), updated_at: new Date('2026-09-12T10:44:30Z'),
    },
    metro: 'CLT', zip: marisolZip, street: 'W Trade St', archetype: 'standard',
    people: [{ first: 'Marisol', last: 'Vega', dob: '1988-06-21', license: '32619084', state: 'NC', relationship: 'self' }],
    cars: [{
      kind: 'car', catalog: R.VEHICLES.find((x) => x.model === 'Accord')!,
      row: { id: 'veh_7731', customer_id: 'cus_01HX9K', vin: '1HGCM82633A004352', year: 2022, make: 'Honda', model: 'Accord', trim: 'EX-L', color: 'Blue',
        license_plate: 'PBK4123', license_plate_state: 'NC', market_value: 24350, created_at: new Date('2024-03-14T16:09:40Z') },
    }],
    special: [],
    plan: { tier: 'full', bi: 100000, pd: 50000, um: 100000, med: 5000, collDed: 500, compDed: 250, rent: [1200, 40], glass: false },
    claimCount: 0,
  };
  households.push(marisol);

  for (let i = 0; i < ARCHETYPES.length; i++) makeHousehold(METROS[i], ARCHETYPES[i]);

  // ---- Policies ----
  const policies: PolicyRec[] = [];

  const ageAt = (dob: string, on: string) => {
    const [y, m, d] = dob.split('-').map(Number);
    const [y2, m2, d2] = on.split('-').map(Number);
    return y2 - y - (m2 < m || (m2 === m && d2 < d) ? 1 : 0);
  };

  function premiumFor(product: string, hh: Household, vehicles: VehicleRec[], drivers: Person[], months: number, start: string): number {
    const metroFactor = { CLT: 1.0, AVL: 0.95, GSP: 0.98, JAX: 1.28, CHS: 1.1, MEM: 1.22, KNX: 0.9, CHA: 0.92 }[hh.metro];
    let annual: number;
    if (product === 'personal_auto') {
      annual = vehicles.reduce((s, v) => s + (hh.plan.tier === 'full' ? 980 : 470) * (1 + v.row.market_value / 90000), 0);
      for (const d of drivers) {
        const a = ageAt(d.dob, start);
        if (d.relationship !== 'self') annual *= a < 25 ? 1.42 : 1.1;
        else if (a < 25) annual *= 1.35;
      }
    } else if (product === 'motorcycle') annual = 260 + vehicles[0].row.market_value * 0.018;
    else if (product === 'classic_car') annual = 180 + vehicles[0].row.market_value * 0.0085;
    else annual = vehicles.length * 2600 * (1 + drivers.length * 0.12);
    // Earlier terms were cheaper; rates have risen ~6% a year.
    const yearsAgo = Math.max(0, (D(AS_OF_DATE).getTime() - D(start).getTime()) / (365 * DAY));
    annual = (annual * metroFactor) / Math.pow(1.06, Math.floor(yearsAgo));
    return Math.round((annual * months) / 12);
  }

  function addPolicy(hh: Household, product: string, start: string, months: number, status: string, opts: { statusDate?: string; reason?: string; current?: boolean; vehicles: VehicleRec[]; number?: string; createdAt?: Date; updatedAt?: Date; premium?: number; billing?: string }): PolicyRec {
    const number = opts.number ?? newPolicyNumber(product, !!opts.current);
    const id = `pol_${number}`;
    const expiration = addMonths(start, months);
    const startYear = Number(start.slice(0, 4));
    const vehicles = opts.vehicles.filter((v) => v.row.year <= startYear + 1 || v === opts.vehicles[0]);
    const includeDrivers = hh.people.filter((p) => (product === 'commercial_auto' ? ['self', 'other'].includes(p.relationship) : p.relationship !== 'other') && ageAt(p.dob, start) >= 16)
      .filter((p) => (product === 'motorcycle' || product === 'classic_car' ? p.relationship === 'self' || (p.relationship === 'spouse' && product === 'classic_car') : true));
    const maxValue = Math.max(...vehicles.map((v) => v.row.market_value));
    const covs = coveragesFor(product, hh.plan, maxValue, product === 'classic_car' ? vehicles[0].row.market_value : undefined);
    const createdAt = opts.createdAt ?? at(addDays(start, -int(20, 35)), int(1, 5));
    const row: Row = {
      id, policy_number: number, customer_id: hh.customer.id, product, status, effective_date: start, expiration_date: expiration,
      status_date: opts.statusDate ?? null, status_reason: opts.reason ?? null,
      premium_amount: opts.premium ?? premiumFor(product, hh, vehicles, includeDrivers, months, start), premium_currency: 'USD',
      billing_frequency: opts.billing ?? (months === 6 ? weighted([['monthly', 5], ['semiannual', 5]]) : weighted([['monthly', 45], ['quarterly', 10], ['semiannual', 15], ['annual', 30]])),
      created_at: createdAt, updated_at: opts.updatedAt ?? (opts.statusDate ? at(opts.statusDate, int(0, 3)) : createdAt),
    };
    ds.policies.push(row);
    const coverages = covs.map((c) => ({
      policy_id: id, code: c.code, name: COVERAGE_NAMES[c.code], limit_amount: c.limit ?? null, deductible_amount: c.deductible ?? null,
      daily_limit_amount: c.daily ?? null, currency: 'USD', sort_order: COVERAGE_ORDER.indexOf(c.code),
    }));
    ds.policy_coverages.push(...coverages);
    for (const v of vehicles) {
      ds.policy_vehicles.push({ policy_id: id, vehicle_id: v.row.id });
      if (!v.row.created_at || v.row.created_at > createdAt) v.row.created_at = createdAt;
    }
    const drivers = includeDrivers.map((p) => {
      const d = {
        id: hh === marisol && p.relationship === 'self' && opts.current ? 'drv_301' : `drv_${++driverSeq}`, policy_id: id, first_name: p.first,
        last_name: p.last, date_of_birth: p.dob, license_number: p.license, license_state: p.state, relationship: p.relationship, created_at: createdAt,
      };
      ds.drivers.push(d);
      return d;
    });
    const end = status === 'lapsed' || status === 'cancelled' ? opts.statusDate! : status === 'quoted' ? start : expiration;
    const rec: PolicyRec = { row, hh, vehicles, coverages, drivers, end };
    policies.push(rec);
    return rec;
  }

  /** A chain of policy terms ending with a term starting at `lastStart`. Returns the terms oldest-first. */
  function termChain(hh: Household, product: string, vehicles: VehicleRec[], lastStart: string, months: number, priorTerms: number, lastStatus: string, lastOpts: Partial<Parameters<typeof addPolicy>[5]> = {}) {
    const recs: PolicyRec[] = [];
    for (let k = priorTerms; k >= 1; k--) {
      const start = addMonths(lastStart, -months * k);
      recs.push(addPolicy(hh, product, start, months, 'expired', { vehicles }));
    }
    recs.push(addPolicy(hh, product, lastStart, months, lastStatus, { vehicles, current: true, ...lastOpts }));
    return recs;
  }

  const dayOfMonth = () => String(pick([1, 1, 1, 5, 10, 15, 15, 20, 25])).padStart(2, '0');
  const monthStart = (from: string, to: string) => {
    const d = randDate(from, to);
    const r = `${d.slice(0, 8)}${dayOfMonth()}`;
    return r > to ? `${d.slice(0, 8)}01` : r < from ? from : r;
  };

  for (const hh of households) {
    const c = hh.customer;
    if (hh === marisol) {
      const veh = hh.cars;
      addPolicy(hh, 'personal_auto', '2024-03-15', 12, 'expired', { vehicles: veh, number: 'AUT-712408', createdAt: new Date('2024-03-14T16:11:52Z'), premium: 1325, billing: 'monthly' });
      addPolicy(hh, 'personal_auto', '2025-03-15', 12, 'expired', { vehicles: veh, number: 'AUT-794416', premium: 1396, billing: 'monthly' });
      // Current term per the Policy API examples. The 2025 term was short-rated to move renewals to the 1st.
      ds.policies[ds.policies.length - 1].expiration_date = '2026-03-01';
      policies[policies.length - 1].end = '2026-03-01';
      addPolicy(hh, 'personal_auto', '2026-03-01', 12, 'active', {
        vehicles: veh, number: 'AUT-882145', current: true, premium: 1480, billing: 'monthly',
        createdAt: new Date('2026-01-30T09:14:02Z'), updatedAt: new Date('2026-01-30T09:14:02Z'),
      });
      continue;
    }

    const months = hh.archetype === 'commercial' ? 12 : chance(0.25) ? 6 : 12;
    const prior = weighted([[0, 3], [1, 4], [2, 3]]);
    let recs: PolicyRec[] = [];
    switch (hh.archetype) {
      case 'standard':
      case 'moto':
      case 'classic':
      case 'commercial': {
        const start = months === 12 ? monthStart('2025-10-20', '2026-10-08') : monthStart('2026-04-20', '2026-10-08');
        const product = hh.archetype === 'commercial' ? 'commercial_auto' : 'personal_auto';
        const veh = hh.archetype === 'commercial' ? hh.special : hh.cars;
        recs = termChain(hh, product, veh, start, months, prior, 'active');
        if (hh.archetype === 'moto' || hh.archetype === 'classic') {
          const product2 = hh.archetype === 'moto' ? 'motorcycle' : 'classic_car';
          const s2 = monthStart('2025-11-01', '2026-09-30');
          recs.push(...termChain(hh, product2, hh.special, s2, 12, weighted([[0, 1], [1, 1]]), 'active'));
        }
        break;
      }
      case 'lapsed': {
        const start = monthStart('2025-11-01', '2026-05-28');
        let lapse = addMonths(start, int(2, 9));
        while (lapse < '2026-07-01') lapse = addMonths(lapse, 1);
        while (lapse > '2026-10-01') lapse = addMonths(lapse, -1);
        recs = termChain(hh, 'personal_auto', hh.cars, start, 12, prior, 'lapsed', { statusDate: lapse, reason: 'non_payment' });
        break;
      }
      case 'cancelled': {
        const start = monthStart('2025-06-01', '2026-03-28');
        const cancel = randDate(addDays(start, 60), [addDays(start, 300), '2026-10-05'].sort()[0]);
        recs = termChain(hh, 'personal_auto', hh.cars, start, 12, prior, 'cancelled', { statusDate: cancel, reason: pick(['moved_out_of_state', 'vehicle_sold', 'insured_request']) });
        c.status = 'inactive';
        break;
      }
      case 'expired': {
        const exp = monthStart('2025-07-01', '2026-09-28');
        recs = termChain(hh, 'personal_auto', hh.cars, addMonths(exp, -12), 12, prior, 'expired');
        c.status = 'inactive';
        break;
      }
      case 'quoted': {
        const created = randDate('2026-10-05', '2026-10-17');
        recs = [addPolicy(hh, 'personal_auto', pick(['2026-11-01', '2026-10-25', '2026-11-15']), 12, 'quoted', { vehicles: hh.cars, current: true, createdAt: at(created, int(9, 20)) })];
        c.created_at = plusMin(recs[0].row.created_at, -int(4, 25));
        break;
      }
      case 'suspended': {
        const start = monthStart('2025-12-01', '2026-04-28');
        recs = termChain(hh, 'personal_auto', hh.cars, start, 12, prior, 'cancelled', { statusDate: randDate('2026-08-10', '2026-09-20'), reason: 'underwriting_fraud_investigation' });
        c.status = 'suspended';
        break;
      }
    }
    if (!c.created_at) {
      const first = recs.reduce((a, b) => (a.row.effective_date < b.row.effective_date ? a : b));
      c.created_at = at(addDays(first.row.effective_date, -int(1, 14)), int(8, 20));
      first.row.created_at = plusMin(c.created_at, int(5, 40));
      if (first.row.updated_at < first.row.created_at) first.row.updated_at = first.row.created_at;
      for (const d of first.drivers) d.created_at = first.row.created_at;
    }
    const last = recs[recs.length - 1].row;
    c.updated_at = c.status === 'active'
      ? new Date(Math.min(AS_OF.getTime() - DAY, c.created_at.getTime() + rand() * (AS_OF.getTime() - c.created_at.getTime())))
      : last.updated_at;
  }
  // Vehicles inherit their first policy term's creation time; any vehicle not yet insured gets the customer's.
  for (const hh of households) {
    for (const v of [...hh.cars, ...hh.special]) {
      if (!v.row.created_at || v.row.created_at < hh.customer.created_at) v.row.created_at = plusMin(hh.customer.created_at, int(3, 20));
      ds.vehicles.push(v.row);
    }
    ds.customers.push(hh.customer);
  }

  // ---- Claims ----
  simulateClaims(ds, households, policies, marisol, vendorById, vendorMetro, vendorPmId, () => `pm_${++customerPmSeq === 3321 ? ++customerPmSeq : customerPmSeq}`);

  // Give some customers a payout account even without a claim payment (enrolled in the app).
  for (const hh of households) {
    if (hh.customer.status !== 'active' || ds.payment_methods.some((p) => p.payee_id === hh.customer.id)) continue;
    if (hh === marisol || chance(0.35)) addCustomerPm(ds, hh, plusH(hh.customer.created_at, int(1, 400)), hh === marisol ? 'pm_3321' : `pm_${++customerPmSeq === 3321 ? ++customerPmSeq : customerPmSeq}`, hh === marisol);
  }

  finalizeIds(ds);
  return ds;
}

function addCustomerPm(ds: Dataset, hh: Household, when: Date, id: string, marisolDefault = false): Row {
  const debit = !marisolDefault && chance(0.25);
  const last4 = marisolDefault ? '4321' : String(int(1000, 9999));
  const row = {
    id, payee_type: 'customer', payee_id: hh.customer.id, type: debit ? 'debit_card' : 'bank_account',
    label: debit ? `Visa debit ending in ${last4}` : `Checking ending in ${last4}`, last4,
    bank_name: marisolDefault ? 'First Example Bank' : pick(['First Example Bank', 'Piedmont Federal Credit Union', 'Palmetto Savings Bank', 'Volunteer State Bank', 'First Coast Credit Union']),
    is_default: true, token_hash: null, created_at: when > AS_OF ? plusH(AS_OF, -48) : when,
  };
  ds.payment_methods.push(row);
  return row;
}

// ---- Claim scenarios ----------------------------------------------------------------------------

type Status = 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'settled' | 'closed' | 'cancelled';

interface Scenario {
  status: Status;
  type: 'collision' | 'comprehensive' | 'theft' | 'glass' | 'vandalism' | 'weather' | 'liability' | 'other';
  metro: Metro;
  loss: [string, string];
  desc: string;
  drivable: boolean;
  injuries?: boolean;
  police?: boolean;
  kind?: 'moto' | 'classic' | 'commercial';
  atHome?: boolean;
  repair?: [number, number];
  glassCost?: [number, number];
  liability?: [number, number];
  totalLoss?: boolean;
  appraisal?: boolean;
  rental?: boolean;
  channel?: 'customer' | 'agent' | 'adjuster';
  draftFirst?: boolean;
  payments?: 'none' | 'partial' | 'pending_approval' | 'processing';
  denial?: string;
  closeAfterDenial?: boolean;
  cancel?: { reason: string; comment: string; stage: 'submitted' | 'under_review'; duplicateOfPrev?: boolean };
  reviewNote?: string;
  customerNote?: string;
  duplicatePayment?: boolean;
  archetype?: Archetype;
}

const S = (s: Scenario) => s;

const SCENARIOS: Scenario[] = [
  // Draft
  S({ status: 'draft', type: 'vandalism', metro: 'CLT', loss: ['2026-10-13', '2026-10-17'], atHome: true, police: true, drivable: true,
    desc: 'Car broken into overnight while parked on {street}; rear passenger window smashed and a backpack was stolen from the back seat.' }),
  S({ status: 'draft', type: 'weather', metro: 'JAX', loss: ['2026-10-12', '2026-10-16'], atHome: true, drivable: true,
    desc: 'A large live oak limb fell on the hood and windshield during last night\'s thunderstorm.' }),
  S({ status: 'draft', type: 'collision', metro: 'KNX', loss: ['2026-10-14', '2026-10-17'], drivable: true, channel: 'agent',
    desc: 'Backed into a concrete pillar in a parking garage near {loc}; rear bumper cover is cracked and the parking sensor is hanging loose.' }),
  // Submitted
  S({ status: 'submitted', type: 'collision', metro: 'CLT', loss: ['2026-10-09', '2026-10-15'], drivable: true, police: true,
    desc: 'Sideswiped by a delivery van changing lanes at {loc}. Driver-side doors and mirror damaged; van driver provided insurance details.',
    customerNote: 'Uploaded photos of the damage and the van driver\'s insurance card.' }),
  S({ status: 'submitted', type: 'collision', metro: 'MEM', loss: ['2026-10-10', '2026-10-15'], drivable: false, police: true,
    desc: 'Rear-ended in stop-and-go traffic on {loc}; trunk crushed and the car is leaking coolant. Not drivable.' }),
  S({ status: 'submitted', type: 'glass', metro: 'GSP', loss: ['2026-10-11', '2026-10-16'], drivable: true, glassCost: [420, 1150],
    desc: 'A rock kicked up by a gravel truck on {loc} cracked the windshield across the driver\'s line of sight.' }),
  S({ status: 'submitted', type: 'theft', metro: 'CHS', loss: ['2026-10-08', '2026-10-14'], atHome: true, police: true, drivable: true, draftFirst: true,
    desc: 'Catalytic converter was cut off overnight while parked on {street}. Car runs but is extremely loud.' }),
  S({ status: 'submitted', type: 'collision', metro: 'JAX', loss: ['2026-10-12', '2026-10-16'], drivable: false, injuries: true, police: true, channel: 'agent',
    desc: 'T-boned at {loc} by a driver who ran a red light. Passenger complained of neck pain and was seen at urgent care.' }),
  // Under review
  S({ status: 'under_review', type: 'collision', metro: 'CHA', loss: ['2026-09-22', '2026-10-06'], drivable: false, repair: [2400, 4200], rental: true,
    desc: 'Hit a deep pothole and then the curb at {loc}; front-right wheel, tire, and lower control arm damaged.',
    reviewNote: 'Inspected photos. Wheel and suspension damage consistent with pothole impact. Sending to in-network shop for teardown estimate.' }),
  S({ status: 'under_review', type: 'collision', metro: 'JAX', loss: ['2026-09-20', '2026-10-02'], drivable: true, police: true, repair: [3800, 6900],
    desc: 'Rear-ended while stopped at {loc}. Rear bumper, tailgate, and backup camera damaged.',
    reviewNote: 'Spoke with insured; other driver admitted fault at the scene. Will pursue subrogation against the other carrier.' }),
  S({ status: 'under_review', type: 'weather', metro: 'AVL', loss: ['2026-09-24', '2026-10-05'], atHome: true, drivable: false, appraisal: true, repair: [7800, 11800],
    desc: 'A large white oak fell on the car during the storm while it was parked on {street}. Roof and windshield crushed.',
    reviewNote: 'Roof structure compromised. Assigned appraisal to determine whether repair cost exceeds 70% of ACV.' }),
  S({ status: 'under_review', type: 'vandalism', metro: 'CLT', loss: ['2026-09-25', '2026-10-07'], atHome: true, police: true, drivable: true, repair: [1600, 3200],
    desc: 'Vehicle keyed along both sides and two tires slashed while parked overnight on {street}.' }),
  S({ status: 'under_review', type: 'theft', metro: 'MEM', loss: ['2026-09-21', '2026-10-01'], atHome: true, police: true, drivable: false, totalLoss: true, rental: true,
    desc: 'Vehicle stolen from the street in front of my home overnight. Police report filed; the vehicle has not been recovered.',
    reviewNote: 'Theft confirmed with Memphis Police Department; vehicle entered in NCIC. Holding 21 days for recovery before total-loss settlement. Valuation requested.' }),
  S({ status: 'under_review', type: 'liability', metro: 'CLT', loss: ['2026-09-26', '2026-10-06'], drivable: true, liability: [1800, 3600],
    desc: 'Misjudged the distance while parallel parking near {loc} and dented the rear door of a parked Toyota Prius. Left a note with my contact details.',
    reviewNote: 'Third-party owner contacted; their vehicle is at an in-network shop for an estimate. Liability accepted.' }),
  S({ status: 'under_review', type: 'collision', metro: 'KNX', loss: ['2026-09-23', '2026-10-04'], kind: 'moto', drivable: false, repair: [2100, 3900],
    desc: 'Low-side slide on wet pavement while turning at {loc}; fairing, mirror, brake lever, and foot peg damaged. Rider uninjured.' }),
  S({ status: 'under_review', type: 'comprehensive', metro: 'CHS', loss: ['2026-09-22', '2026-10-03'], atHome: true, drivable: false, repair: [1400, 2900],
    desc: 'Rodents chewed through the engine wiring harness while parked at home; check-engine light on and the car will not start.' }),
  // Approved
  S({ status: 'approved', type: 'theft', metro: 'JAX', loss: ['2026-08-24', '2026-09-08'], police: true, drivable: false, totalLoss: true, payments: 'pending_approval',
    desc: 'Vehicle stolen from a parking lot at {loc}. Recovered nine days later stripped and burned; declared a total loss.',
    reviewNote: 'Recovered vehicle inspected at tow yard. Burn damage throughout; total loss. Requesting ACV valuation.' }),
  S({ status: 'approved', type: 'collision', metro: 'MEM', loss: ['2026-09-02', '2026-09-20'], drivable: false, police: true, repair: [7200, 11500], rental: true, payments: 'partial',
    desc: 'Struck by a driver who ran a stop sign at {loc}; front end damaged and both front airbags deployed.' }),
  S({ status: 'approved', type: 'glass', metro: 'GSP', loss: ['2026-09-28', '2026-10-08'], drivable: true, glassCost: [480, 1350], payments: 'processing',
    desc: 'Windshield cracked by road debris on {loc}; crack is spreading from the lower passenger corner.' }),
  S({ status: 'approved', type: 'weather', metro: 'CHS', loss: ['2026-09-05', '2026-09-20'], atHome: true, drivable: false, repair: [5200, 8800], payments: 'none',
    desc: 'King-tide flooding on {street}; water reached the floorboards while the car was parked and the interior carpet and seat motors are soaked.' }),
  S({ status: 'approved', type: 'vandalism', metro: 'CHS', loss: ['2026-08-28', '2026-09-15'], kind: 'classic', police: true, drivable: true, repair: [3800, 6400], payments: 'none',
    desc: 'Convertible top slashed and the interior damaged while parked at a car show near {loc}.' }),
  // Denied
  S({ status: 'denied', type: 'collision', metro: 'CLT', loss: ['2026-05-10', '2026-06-20'], drivable: true, appraisal: true,
    desc: 'Front bumper and grille damaged; reported several weeks after the incident.',
    denial: 'Appraisal found the front-end damage inconsistent with the reported loss: corrosion and prior repair are present in the damaged area.' }),
  S({ status: 'denied', type: 'other', metro: 'JAX', loss: ['2026-07-15', '2026-08-25'], drivable: false,
    desc: 'Transmission failed while driving on {loc}; the car would not shift out of second gear and had to be towed.',
    denial: 'Mechanical breakdown is excluded under the policy. No collision or other covered peril was identified.' }),
  // Settled
  S({ status: 'settled', type: 'collision', metro: 'CLT', loss: ['2026-07-01', '2026-08-15'], drivable: false, police: true, repair: [3600, 6200], rental: true,
    desc: 'Rear-ended at {loc} while waiting to turn; trunk lid and rear bumper crushed.' }),
  S({ status: 'settled', type: 'glass', metro: 'JAX', loss: ['2026-08-01', '2026-09-05'], drivable: true, glassCost: [380, 980],
    desc: 'Windshield chipped by a rock on {loc}; the chip spread into a long crack overnight.' }),
  S({ status: 'settled', type: 'comprehensive', metro: 'AVL', loss: ['2026-07-05', '2026-08-20'], drivable: true, repair: [2600, 4800],
    desc: 'Struck a deer that ran onto Hendersonville Rd at dusk; hood, headlight, and front bumper damaged.' }),
  S({ status: 'settled', type: 'collision', metro: 'MEM', loss: ['2026-07-10', '2026-08-25'], drivable: true, repair: [2200, 3900], rental: true,
    desc: 'Clipped a concrete barrier while merging at {loc}; passenger-side doors and rocker panel damaged.' }),
  S({ status: 'settled', type: 'theft', metro: 'KNX', loss: ['2026-06-20', '2026-08-01'], atHome: true, police: true, drivable: false, repair: [1800, 3200],
    desc: 'Car stolen from in front of my home on {street} and recovered two days later with a broken steering column and ignition.' }),
  // Closed
  S({ status: 'closed', type: 'collision', metro: 'CLT', loss: ['2025-03-10', '2025-04-20'], drivable: false, police: true, repair: [4200, 7600], rental: true,
    desc: 'Hit by a driver who failed to yield while making a left turn at {loc}; front-left fender, wheel, and headlight damaged.' }),
  S({ status: 'closed', type: 'glass', metro: 'JAX', loss: ['2025-04-15', '2025-06-01'], drivable: true, glassCost: [350, 900],
    desc: 'Windshield cracked by a rock thrown up by a truck on {loc}.' }),
  S({ status: 'closed', type: 'collision', metro: 'GSP', loss: ['2025-05-01', '2025-06-30'], drivable: true, repair: [1900, 3400],
    desc: 'Rolled into a pole in a slick parking lot near {loc}; front bumper and grille damaged.' }),
  S({ status: 'closed', type: 'vandalism', metro: 'CHA', loss: ['2025-06-01', '2025-07-31'], atHome: true, police: true, drivable: true, repair: [900, 2200],
    desc: 'Smash-and-grab break-in on {street}; driver window shattered and door panel damaged.' }),
  S({ status: 'closed', type: 'theft', metro: 'MEM', loss: ['2025-07-01', '2025-08-31'], atHome: true, police: true, drivable: false, totalLoss: true,
    desc: 'Vehicle stolen from my driveway overnight and never recovered.' }),
  S({ status: 'closed', type: 'weather', metro: 'KNX', loss: ['2026-01-15', '2026-02-05'], atHome: true, drivable: true, repair: [1700, 3600],
    desc: 'An ice-laden tree limb fell on the car during the January ice storm while parked on {street}; roof dented and sunroof glass cracked.' }),
  S({ status: 'closed', type: 'collision', metro: 'CLT', loss: ['2025-09-01', '2025-10-31'], drivable: true, police: true, repair: [2800, 5200], rental: true, duplicatePayment: true,
    desc: 'Rear-ended at {loc} during evening rush hour; rear bumper and trunk lid damaged.' }),
  S({ status: 'closed', type: 'weather', metro: 'JAX', loss: ['2025-09-15', '2025-10-25'], atHome: true, drivable: true, repair: [1200, 2600],
    desc: 'Tropical-storm winds blew a neighbor\'s fence panel onto the car parked on {street}; scratches and dents along the passenger side.' }),
  S({ status: 'closed', type: 'glass', metro: 'AVL', loss: ['2026-01-10', '2026-02-20'], drivable: true, glassCost: [400, 1100],
    desc: 'Windshield cracked by debris on {loc}.' }),
  S({ status: 'closed', type: 'liability', metro: 'MEM', loss: ['2026-02-01', '2026-03-15'], drivable: true, liability: [2400, 5200],
    desc: 'Rear-ended another car at low speed at {loc} when traffic stopped suddenly; the other car\'s bumper was damaged.' }),
  S({ status: 'closed', type: 'glass', metro: 'CHA', loss: ['2026-03-01', '2026-04-10'], drivable: true, glassCost: [450, 1200],
    desc: 'Rock chip from a truck on {loc} spread across the windshield.' }),
  S({ status: 'closed', type: 'collision', metro: 'AVL', loss: ['2026-03-20', '2026-05-15'], kind: 'moto', drivable: false, repair: [1600, 3200],
    desc: 'Motorcycle was knocked over by a car backing out of a parking space near {loc}; tank, mirror, and clutch lever damaged.' }),
  S({ status: 'closed', type: 'comprehensive', metro: 'JAX', loss: ['2026-04-15', '2026-06-10'], drivable: true, repair: [1500, 3400],
    desc: 'A car fire in the next space of a parking structure near {loc} blistered the paint and melted the rear lights.' }),
  S({ status: 'closed', type: 'collision', metro: 'GSP', loss: ['2026-04-01', '2026-05-20'], drivable: true, appraisal: true, closeAfterDenial: true,
    desc: 'Rear-ended at a traffic light at {loc}; rear bumper damaged.',
    denial: 'The driver at the time of the loss is excluded from coverage by a named-driver exclusion on the policy.' }),
  // Cancelled
  S({ status: 'cancelled', type: 'collision', metro: 'CLT', loss: ['2026-06-01', '2026-08-30'], drivable: true, repair: [900, 1600],
    cancel: { reason: 'customer_request', comment: 'Customer decided to pay out of pocket to avoid a rate increase.', stage: 'under_review' },
    desc: 'Scraped the front bumper on a parking bollard at {loc}.' }),
  S({ status: 'closed', type: 'collision', metro: 'JAX', loss: ['2025-10-01', '2026-01-31'], drivable: true, repair: [2400, 4400],
    desc: 'Side-swiped by a car drifting into my lane at {loc}; driver-side doors scraped and mirror broken.' }),
  S({ status: 'cancelled', type: 'collision', metro: 'JAX', loss: ['2025-10-01', '2026-01-31'], drivable: true, channel: 'adjuster',
    cancel: { reason: 'duplicate', comment: 'Duplicate of {prevClaim}; customer also reported this loss by phone.', stage: 'submitted', duplicateOfPrev: true },
    desc: 'Customer called to report a side-swipe; driver-side doors scraped and mirror broken.' }),
  S({ status: 'cancelled', type: 'theft', metro: 'MEM', loss: ['2026-07-01', '2026-08-05'], police: true, drivable: false, archetype: 'suspended', totalLoss: true,
    cancel: { reason: 'fraud_suspected', comment: 'Referred to SIU; vehicle located at a known export broker with the insured listed as seller.', stage: 'under_review' },
    desc: 'Vehicle stolen from a parking lot at {loc} overnight.' }),
  S({ status: 'cancelled', type: 'collision', metro: 'KNX', loss: ['2026-05-01', '2026-08-31'], drivable: true, police: true,
    cancel: { reason: 'other', comment: "Other driver's insurer accepted liability and is handling the repair directly.", stage: 'under_review' },
    desc: 'Rear-ended by another driver at {loc}; the other driver admitted fault.' }),
];

const CUSTOMER_NOTES = [
  'Please contact me after 5pm ET about repair scheduling.',
  'Uploaded four photos of the damage from different angles.',
  'Is a rental car covered while my car is in the shop?',
  'I can drop the car off at the shop any weekday morning.',
  'Please text me rather than call; I am at work during the day.',
];

const REVIEW_NOTES: Record<string, string[]> = {
  collision: ['Photos reviewed. Damage consistent with the reported impact.', 'Recorded statement taken from insured; loss facts consistent with police report.'],
  comprehensive: ['Photos reviewed; damage consistent with a comprehensive loss. No prior damage noted.'],
  theft: ['Police report obtained and matches the insured\'s statement.'],
  glass: ['Glass-only loss; routed to in-network mobile glass vendor.'],
  vandalism: ['Police report obtained; damage consistent with vandalism.'],
  weather: ['Confirmed storm activity in the area on the loss date via NWS reports.'],
  liability: ['Insured accepted responsibility; contacting the third party.'],
  other: ['Reviewing loss details to determine whether a covered peril applies.'],
};

function simulateClaims(
  ds: Dataset,
  households: Household[],
  policies: PolicyRec[],
  marisol: Household,
  vendorById: Map<string, Row>,
  vendorMetro: Map<string, Metro>,
  vendorPmId: (id: string) => string,
  nextCustomerPm: () => string,
) {
  let tmp = 0;
  const tmpId = (kind: string) => `tmp_${kind}_${++tmp}`;
  const invoiceCounters = new Map<string, number>();
  const invoiceNumber = (vendor: Row, date: Date) => {
    const prefix = vendor.name.split(/\s+/).filter((w: string) => /^[A-Za-z]/.test(w)).slice(0, 3).map((w: string) => w[0].toUpperCase()).join('');
    let n = (invoiceCounters.get(vendor.id) ?? int(1000, 1120)) + int(1, 9);
    if (vendor.id === 'ven_4417' && n === 1182) n++;
    invoiceCounters.set(vendor.id, n);
    return `${prefix}-${date.getUTCFullYear()}-${n}`;
  };
  const customerPm = new Map<string, Row>(ds.payment_methods.filter((p) => p.payee_type === 'customer').map((p) => [p.payee_id, p]));

  const event = (claimId: string, at: Date, evt: string, actor: { type: string; id: string } | null, summary: string) =>
    ds.claim_events.push({ claim_id: claimId, at, event: evt, actor_type: actor?.type ?? null, actor_id: actor?.id ?? null, summary });
  const note = (claimId: string, at: Date, author: { type: string; id: string }, visibility: string, body: string) =>
    ds.claim_notes.push({ id: tmpId('note'), claim_id: claimId, author_type: author.type, author_id: author.id, visibility, body, created_at: at });
  const SYS = { type: 'system', id: 'sys_claims' };
  const PAYSYS = { type: 'system', id: 'sys_payments' };
  const AGENT = { type: 'system', id: R.AGENT_ID };

  // ---- Marisol Vega's collision claim, exactly as the spec examples describe it ----
  {
    const pol = policies.find((p) => p.row.id === 'pol_AUT-882145')!;
    const id = 'clm_2026-000417';
    const cust = { type: 'customer', id: 'cus_01HX9K' };
    const adj = { type: 'adjuster', id: 'adj_220' };
    const ven = { type: 'vendor', id: 'ven_4417' };
    ds.claims.push({
      id, customer_id: 'cus_01HX9K', policy_id: pol.row.id, vehicle_id: 'veh_7731', status: 'approved', type: 'collision', loss_date: '2026-10-02',
      loss_location: { addressLine1: '100 N Tryon St', city: 'Charlotte', state: 'NC', postalCode: '28202', country: 'US' },
      description: 'Rear-ended at a stoplight on N Tryon St. Rear bumper and trunk damaged.', drivable: true, injuries: false,
      police_report_number: 'CMPD-26-114382', estimated_amount: 4850, deductible_amount: 500, currency: 'USD', coverage_code: 'COLL',
      assigned_adjuster_id: 'adj_220', cancel_reason: null, cancel_comment: null, created_by_type: 'customer', created_by_id: 'cus_01HX9K',
      created_at: new Date('2026-10-02T18:21:07Z'), updated_at: new Date('2026-10-08T21:47:19Z'),
    });
    ds.coverage_verifications.push({
      policy_id: pol.row.id, claim_id: id, request: { lossDate: '2026-10-02', claimType: 'collision', vehicleId: 'veh_7731', driverId: 'drv_301' },
      result: { covered: true, policyId: pol.row.id, lossDate: '2026-10-02', coverage: { code: 'COLL', name: 'Collision', limit: { amount: 50000, currency: 'USD' }, deductible: { amount: 500, currency: 'USD' } }, reasons: [], verifiedAt: '2026-10-02T18:21:06Z' },
      verified_at: new Date('2026-10-02T18:21:06Z'),
    });
    event(id, new Date('2026-10-02T18:21:07Z'), 'claim.created', cust, 'Claim created and submitted.');
    event(id, new Date('2026-10-02T18:21:07Z'), 'coverage.verified', { type: 'system', id: 'sys_policy_api' }, 'Coverage verified against policy pol_AUT-882145: Collision, deductible 500.00 USD.');
    event(id, new Date('2026-10-03T09:12:41Z'), 'claim.adjuster_assigned', adj, 'Adjuster adj_220 (Priya Raman) assigned.');
    event(id, new Date('2026-10-03T09:12:55Z'), 'claim.status_changed', adj, 'Status changed from submitted to under_review.');
    event(id, new Date('2026-10-03T09:12:55Z'), 'claim.estimate_updated', adj, 'Estimate set to 4850.00 USD.');
    ds.claim_notes.push({ id: 'note_001', claim_id: id, author_type: 'adjuster', author_id: 'adj_220', visibility: 'internal', body: 'Photos reviewed. Damage consistent with rear impact.', created_at: new Date('2026-10-03T09:10:00Z') });
    ds.work_orders.push({
      id: 'wo_9001', assignment_id: 'asg_5521', claim_id: id, vendor_id: 'ven_4417', type: 'repair', status: 'in_progress', estimate_amount: 4350, currency: 'USD',
      scheduled_for: '2026-10-07T09:00:00-04:00', instructions: 'Replace rear bumper cover and repair trunk lid. Submit supplement for hidden damage.',
      notes: 'Parts on order; estimated 3 business days.', created_at: new Date('2026-10-03T09:30:00Z'), updated_at: new Date('2026-10-07T09:05:00Z'),
    });
    event(id, new Date('2026-10-03T09:30:00Z'), 'assignment.created', adj, 'Bayview Collision & Auto Body (ven_4417) requested for repair (assignment asg_5521, work order wo_9001).');
    event(id, new Date('2026-10-03T11:02:31Z'), 'work_order.status_changed', ven, 'Work order wo_9001 (Bayview Collision & Auto Body) status changed from issued to accepted.');
    event(id, new Date('2026-10-07T09:05:00Z'), 'work_order.status_changed', ven, 'Work order wo_9001 (Bayview Collision & Auto Body) status changed from accepted to in_progress.');
    event(id, new Date('2026-10-07T09:05:00Z'), 'work_order.estimate_submitted', ven, 'Bayview Collision & Auto Body submitted an estimate of 4350.00 USD on work order wo_9001.');
    ds.claim_notes.push({ id: tmpId('note'), claim_id: id, author_type: 'customer', author_id: 'cus_01HX9K', visibility: 'customer', body: 'Dropped the car off at Bayview this morning. Do I need to pay the deductible to the shop?', created_at: new Date('2026-10-07T16:22:40Z') });
    ds.claim_notes.push({ id: tmpId('note'), claim_id: id, author_type: 'adjuster', author_id: 'adj_220', visibility: 'customer', body: 'Yes, the $500 collision deductible is paid to Bayview when you pick up the car. We pay the shop the rest of the approved estimate directly.', created_at: new Date('2026-10-08T17:03:12Z') });
    event(id, new Date('2026-10-08T21:47:19Z'), 'claim.status_changed', adj, 'Status changed from under_review to approved. Approved amount 4350.00 USD (estimate 4850.00 USD less 500.00 USD deductible).');
    ds.payments.push({
      id: 'pay_90311', claim_id: id, type: 'vendor_invoice', payee_type: 'vendor', payee_id: 'ven_4417', payment_method_id: 'pm_8802', amount: 3850, currency: 'USD',
      status: 'completed', method: 'ach', invoice_number: 'BCA-2026-1182', memo: 'Collision repair, invoice BCA-2026-1182.', created_by: 'adj_220', approved_by: null,
      approval_comment: null, cancel_reason: null, cancel_comment: null, settle_after: null, created_at: new Date('2026-10-10T13:00:00Z'),
      completed_at: new Date('2026-10-12T08:00:00Z'), updated_at: new Date('2026-10-12T08:00:00Z'),
    });
    event(id, new Date('2026-10-10T13:00:00Z'), 'payment.created', adj, 'Payment pay_90311 of 3850.00 USD (vendor_invoice) to vendor ven_4417 created.');
    event(id, new Date('2026-10-12T08:00:00Z'), 'payment.completed', PAYSYS, 'Payment pay_90311 of 3850.00 USD to vendor ven_4417 completed.');
    ds.refunds.push({ id: 'ref_2001', payment_id: 'pay_90311', amount: 200, currency: 'USD', reason: 'overpayment', status: 'completed', created_by: 'adj_220', settle_after: null, created_at: new Date('2026-10-15T10:00:00Z'), completed_at: new Date('2026-10-16T14:00:00Z') });
    event(id, new Date('2026-10-15T10:00:00Z'), 'refund.created', adj, 'Refund ref_2001 of 200.00 USD (overpayment) requested on payment pay_90311.');
    event(id, new Date('2026-10-16T14:00:00Z'), 'refund.completed', PAYSYS, 'Refund ref_2001 of 200.00 USD on payment pay_90311 completed.');
    ds.claim_notes.push({ id: tmpId('note'), claim_id: id, author_type: 'adjuster', author_id: 'adj_220', visibility: 'internal', body: 'Shop invoice was 200.00 lower than the approved estimate (bumper cover sourced aftermarket-certified). Bayview refunded the difference via ref_2001.', created_at: new Date('2026-10-15T10:04:51Z') });
    marisol.claimCount++;
  }

  let prevClaimId: string | undefined;
  for (const s of SCENARIOS) {
    // ---- Pick a household/policy/vehicle that could actually have had this loss ----
    const open = ['draft', 'submitted', 'under_review', 'approved', 'settled'].includes(s.status);
    const covNeeded: string[] = ({ collision: ['COLL'], comprehensive: ['COMP'], theft: ['COMP'], glass: ['GLASS', 'COMP'], vandalism: ['COMP'], weather: ['COMP'], liability: ['PD', 'CSL'], other: [] } as Record<string, string[]>)[s.type];
    let chosen: { pol: PolicyRec; loss: string } | undefined;
    for (let attempt = 0; attempt < 60 && !chosen; attempt++) {
      const loss = randDate(s.loss[0], s.loss[1]);
      const cands = policies.filter((p) => {
        if (p.hh === marisol || p.hh.metro !== s.metro || p.row.status === 'quoted') return false;
        if (s.archetype ? p.hh.archetype !== s.archetype : p.hh.archetype === 'suspended') return false;
        if (!(p.row.effective_date <= loss && loss < p.end)) return false;
        if (open && (p.hh.customer.status !== 'active' || p.row.status !== 'active')) return false;
        const product = s.kind === 'moto' ? 'motorcycle' : s.kind === 'classic' ? 'classic_car' : null;
        if (product ? p.row.product !== product : !['personal_auto', 'commercial_auto'].includes(p.row.product)) return false;
        if (s.status !== 'denied' && !s.closeAfterDenial && s.type !== 'other' && !p.coverages.some((c) => covNeeded.includes(c.code))) return false;
        if (s.rental && !p.coverages.some((c) => c.code === 'RENT') && attempt < 40) return false;
        if (s.cancel?.duplicateOfPrev) return p.hh.customer.id === ds.claims[ds.claims.length - 1].customer_id && loss === ds.claims[ds.claims.length - 1].loss_date;
        return true;
      });
      if (!cands.length) continue;
      const fewest = Math.min(...cands.map((p) => p.hh.claimCount));
      chosen = { pol: pick(cands.filter((p) => p.hh.claimCount === fewest)), loss };
    }
    if (s.cancel?.duplicateOfPrev && !chosen) {
      const prev = ds.claims[ds.claims.length - 1];
      chosen = { pol: policies.find((p) => p.row.id === prev.policy_id)!, loss: prev.loss_date };
    }
    if (!chosen) throw new Error(`No eligible policy for scenario ${s.status}/${s.type}/${s.metro}`);
    const { pol } = chosen;
    const lossDate = chosen.loss;
    const hh = pol.hh;
    hh.claimCount++;
    const vehicle = s.cancel?.duplicateOfPrev
      ? pol.vehicles.find((v) => v.row.id === ds.claims[ds.claims.length - 1].vehicle_id) ?? pol.vehicles[0]
      : pick(pol.vehicles);
    const cov = pol.coverages.find((c) => covNeeded.includes(c.code) && covNeeded.indexOf(c.code) === Math.min(...pol.coverages.filter((x) => covNeeded.includes(x.code)).map((x) => covNeeded.indexOf(x.code))));
    const deductible: number = cov?.deductible_amount ?? 0;
    const rentCov = pol.coverages.find((c) => c.code === 'RENT');

    const lossLoc = s.atHome
      ? { addressLine1: hh.customer.address_line1, city: hh.customer.city, state: hh.customer.state, postalCode: hh.customer.postal_code, country: 'US' }
      : (() => { const l = pick(R.LOSS_LOCATIONS[s.metro]); const zi = R.zipInfo(l.zip); return { addressLine1: l.line, city: zi.city, state: zi.state, postalCode: l.zip, country: 'US' }; })();
    const description = s.desc.replace('{loc}', lossLoc.addressLine1).replace('{street}', hh.street);
    const policePrefix = /^(I-|US-|SR-)/.test(lossLoc.addressLine1) ? R.STATE_PATROL[lossLoc.state] : R.POLICE[lossLoc.city] ?? 'PD';
    const police = s.police ? `${policePrefix}-${lossDate.slice(2, 4)}-${String(int(100000, 199999))}` : null;

    const id = tmpId('claim');
    const customerActor = { type: 'customer', id: hh.customer.id };
    const metroAdjusters = R.ADJUSTERS_BY_METRO[s.metro];
    const adjuster = { type: 'adjuster', id: pick(metroAdjusters) };
    const creator = s.channel === 'agent' ? AGENT : s.channel === 'adjuster' ? adjuster : customerActor;

    // First notice of loss.
    const fnolDate = addDays(lossDate, s.type === 'theft' ? int(0, 1) : int(0, 2));
    let t = at(fnolDate, int(7, 21));
    if (fnolDate > AS_OF_DATE || t > AS_OF) t = plusH(AS_OF, -int(3, 30));
    const createdAt = t;
    const claim: Row = {
      id, customer_id: hh.customer.id, policy_id: pol.row.id, vehicle_id: vehicle.row.id, status: 'draft', type: s.type, loss_date: lossDate,
      loss_location: lossLoc, description, drivable: s.drivable, injuries: s.injuries ?? false, police_report_number: police, estimated_amount: null,
      deductible_amount: cov?.deductible_amount ?? null, currency: 'USD', coverage_code: cov?.code ?? null, assigned_adjuster_id: null, cancel_reason: null,
      cancel_comment: null, created_by_type: creator.type, created_by_id: creator.id, created_at: createdAt, updated_at: createdAt,
    };
    ds.claims.push(claim);
    const verifiedAt = plusMin(createdAt, -0.02);
    ds.coverage_verifications.push({
      policy_id: pol.row.id, claim_id: id, request: { lossDate, claimType: s.type, vehicleId: vehicle.row.id },
      result: {
        covered: true, policyId: pol.row.id, lossDate,
        ...(cov ? { coverage: { code: cov.code, name: cov.name, ...(cov.limit_amount != null ? { limit: { amount: cov.limit_amount, currency: 'USD' } } : {}), ...(cov.deductible_amount != null ? { deductible: { amount: cov.deductible_amount, currency: 'USD' } } : {}) } } : {}),
        reasons: s.type === 'other' ? [{ code: 'ADJUSTER_REVIEW_REQUIRED', message: 'Losses of type "other" require an adjuster to determine the applicable coverage.' }] : [],
        verifiedAt: verifiedAt.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      },
      verified_at: verifiedAt,
    });
    const submitNow = s.status !== 'draft' && !s.draftFirst;
    const onBehalf = creator.type === 'customer' ? '' : ` by ${creator.id} on behalf of ${hh.customer.id}`;
    event(id, createdAt, 'claim.created', creator, submitNow ? `Claim created and submitted${onBehalf}.` : `Claim created as draft${onBehalf}.`);
    event(id, createdAt, 'coverage.verified', { type: 'system', id: 'sys_policy_api' },
      cov ? `Coverage verified against policy ${pol.row.id}: ${cov.name}${cov.deductible_amount != null ? `, deductible ${Number(cov.deductible_amount).toFixed(2)} USD` : ''}.`
        : `Policy ${pol.row.id} active on loss date; coverage to be determined by adjuster.`);
    if (creator === AGENT) note(id, plusMin(createdAt, 1), AGENT, 'internal', `Claim intake completed by Vandelay Claims Assistant in chat. Customer uploaded ${int(2, 6)} photos and confirmed the loss details.`);
    if (s.customerNote || chance(0.3)) note(id, bizAfter(createdAt, 1, 20) < AS_OF ? bizAfter(createdAt, 1, 20) : plusMin(createdAt, 30), customerActor, 'customer', s.customerNote ?? pick(CUSTOMER_NOTES));
    if (submitNow) claim.status = 'submitted';
    if (s.status === 'draft') { prevClaimId = id; continue; }
    if (s.draftFirst) {
      t = plusH(createdAt, int(2, 20));
      if (t > AS_OF) t = plusH(AS_OF, -1);
      claim.status = 'submitted';
      claim.updated_at = t;
      event(id, t, 'claim.status_changed', customerActor, 'Status changed from draft to submitted.');
    }

    // ---- Vendor engagements ----
    interface Engagement { wo: Row; vendor: Row; amount?: number; completedAt?: Date }
    const engagements: Engagement[] = [];
    const findVendor = (type: string): Row | undefined => {
      const zip = lossLoc.postalCode;
      const inMetro = [...vendorById.values()].filter((v) => v.type === type && v.status === 'active' && v.in_network && vendorMetro.get(v.id) === s.metro);
      const serving = inMetro.filter((v) => v.service_area.includes(zip));
      if (serving.length) return pick(serving);
      // No one serves this ZIP yet: the nearest shop extends its service area to cover it.
      const zi = R.zipInfo(zip);
      const nearest = inMetro.sort((a, b) => Math.hypot(a.latitude - zi.lat, a.longitude - zi.lon) - Math.hypot(b.latitude - zi.lat, b.longitude - zi.lon))[0];
      if (nearest && !nearest.service_area.includes(zip)) nearest.service_area.push(zip);
      return nearest;
    };
    const vendorActor = (v: Row) => ({ type: 'vendor', id: v.id });
    const engage = (type: string, created: Date, by: { type: string; id: string }, instructions: string, steps: { accepted?: Date; inProgress?: Date; completed?: Date; estimate?: number; estimateAt?: Date; scheduledFor?: string; notes?: string }) => {
      const vendor = findVendor(type);
      if (!vendor || created > AS_OF) return undefined;
      const wo: Row = {
        id: tmpId('wo'), assignment_id: tmpId('asg'), claim_id: id, vendor_id: vendor.id, type, status: 'issued', estimate_amount: null, currency: 'USD',
        scheduled_for: steps.scheduledFor ?? null, instructions, notes: null, created_at: created, updated_at: created,
      };
      ds.work_orders.push(wo);
      event(id, created, 'assignment.created', by, `${vendor.name} (${vendor.id}) requested for ${type} (assignment ${wo.assignment_id}, work order ${wo.id}).`);
      const step = (when: Date | undefined, to: string) => {
        if (!when || when > AS_OF) return false;
        event(id, when, 'work_order.status_changed', vendorActor(vendor), `Work order ${wo.id} (${vendor.name}) status changed from ${wo.status} to ${to}.`);
        wo.status = to;
        wo.updated_at = when;
        return true;
      };
      const eng: Engagement = { wo, vendor };
      if (step(steps.accepted, 'accepted')) {
        if (steps.estimate !== undefined && steps.estimateAt && steps.estimateAt <= AS_OF) {
          wo.estimate_amount = steps.estimate;
          eng.amount = steps.estimate;
          if (steps.estimateAt > wo.updated_at) wo.updated_at = steps.estimateAt;
          event(id, steps.estimateAt, 'work_order.estimate_submitted', vendorActor(vendor), `${vendor.name} submitted an estimate of ${steps.estimate.toFixed(2)} USD on work order ${wo.id}.`);
        }
        if (step(steps.inProgress, 'in_progress') && steps.notes) wo.notes = steps.notes;
        if (step(steps.completed, 'completed')) eng.completedAt = steps.completed;
      }
      engagements.push(eng);
      return eng;
    };

    // Tow at first notice when the vehicle can't be driven.
    let tow: Engagement | undefined;
    if (!s.drivable) {
      const c0 = plusMin(createdAt, int(8, 35));
      const done = plusMin(c0, int(90, 200));
      tow = engage('tow', c0, creator.type === 'customer' ? SYS : creator, `Tow from ${lossLoc.addressLine1}, ${lossLoc.city} to the nearest in-network shop or secure storage.`, {
        accepted: plusMin(c0, int(4, 15)), inProgress: plusMin(c0, int(30, 70)), completed: done, estimate: roundTo(int(185, 475), 5), estimateAt: done,
      });
    }
    if (s.status === 'submitted') {
      if (s.type === 'glass') engage('glass', bizAfter(createdAt, 0.2, 2), SYS, 'Replace windshield; recalibrate ADAS camera if equipped.', {});
      prevClaimId = id;
      continue;
    }

    // ---- Adjuster review ----
    const reviewAt = (() => { let r = bizAfter(createdAt, 12, 30); if (r > AS_OF) r = plusH(AS_OF, -2); return r; })();
    claim.assigned_adjuster_id = adjuster.id;
    const adj = R.ADJUSTERS.find((a) => a.id === adjuster.id)!;
    event(id, plusMin(reviewAt, -0.25), 'claim.adjuster_assigned', adjuster, `Adjuster ${adj.id} (${adj.first_name} ${adj.last_name}) assigned.`);

    if (s.cancel?.stage === 'submitted') {
      const when = plusMin(createdAt, int(40, 180));
      claim.status = 'cancelled';
      claim.cancel_reason = s.cancel.reason;
      claim.cancel_comment = s.cancel.comment.replace('{prevClaim}', prevClaimId ?? '');
      claim.updated_at = when;
      event(id, when, 'claim.cancelled', adjuster, `Claim cancelled (${s.cancel.reason}): ${claim.cancel_comment}`);
      prevClaimId = id;
      continue;
    }

    claim.status = 'under_review';
    claim.updated_at = reviewAt;
    event(id, reviewAt, 'claim.status_changed', adjuster, 'Status changed from submitted to under_review.');
    note(id, plusMin(reviewAt, int(5, 40)), adjuster, 'internal', s.reviewNote ?? pick(REVIEW_NOTES[s.type]));

    // Plan the work.
    let t1 = bizAfter(reviewAt, 0.3, 2);
    let appraisal: Engagement | undefined;
    let appraisalDone = reviewAt;
    if (s.appraisal || s.totalLoss) {
      appraisalDone = bizAfter(t1, 40, 90);
      appraisal = engage('appraisal', t1, adjuster, s.totalLoss ? 'Prepare actual cash value (ACV) valuation for total-loss settlement.' : 'Inspect vehicle and prepare a damage appraisal.', {
        accepted: bizAfter(t1, 1, 4), completed: appraisalDone, estimate: roundTo(int(175, 295), 5), estimateAt: appraisalDone,
      });
      if (appraisal?.completedAt) {
        note(id, plusMin(appraisalDone, int(20, 180)), adjuster, 'internal', s.totalLoss
          ? `Valuation received from ${appraisal.vendor.name}: ACV ${Number(vehicle.row.market_value).toFixed(2)} USD based on comparable listings.`
          : `Appraisal received from ${appraisal.vendor.name}.`);
      }
      t1 = bizAfter(appraisalDone, 1, 6);
    }

    let mainCost = 0;
    let main: Engagement | undefined;
    let rental: Engagement | undefined;
    let rentalReimb: { days: number; daily: number; amount: number; at: Date } | undefined;
    let estimateAt: Date = appraisalDone;
    let repairDone: Date | undefined;
    const denied = !!s.denial;

    if (!denied && (s.repair || s.glassCost || s.liability)) {
      const isGlass = !!s.glassCost;
      const [lo, hi] = s.glassCost ?? s.liability ?? s.repair!;
      mainCost = round2(Math.max(lo, deductible + 150) + rand() * (hi - Math.max(lo, deductible + 150)));
      mainCost = roundTo(mainCost, 0.01);
      const created = isGlass ? bizAfter(reviewAt, 0.2, 3) : t1;
      const accepted = bizAfter(created, 0.5, 5);
      const schedDay = ptDate(bizAfter(accepted, isGlass ? 18 : 30, isGlass ? 50 : 110));
      const scheduledFor = localIso(schedDay, isGlass ? pick([8, 10, 13]) : 9);
      const start = new Date(new Date(scheduledFor).getTime() + int(3, 25) * 60_000);
      repairDone = isGlass ? plusMin(start, int(90, 180)) : bizAfter(start, 50, 180);
      const estAt = isGlass ? plusMin(accepted, int(20, 120)) : bizAfter(accepted, 18, 30);
      const thirdParty = s.liability ? `Third-party vehicle (claimant's ${pick(['2019 Toyota Prius', '2021 Honda Civic', '2017 Subaru Outback', '2020 Ford Escape'])}). ` : '';
      main = engage(isGlass ? 'glass' : 'repair', created, adjuster,
        isGlass ? 'Replace windshield with OEM-equivalent glass; recalibrate forward camera.' : `${thirdParty}Repair per adjuster photos; submit supplement before any additional work.`,
        { accepted, inProgress: start, completed: repairDone, estimate: mainCost, estimateAt: estAt, scheduledFor,
          notes: isGlass ? undefined : pick(['Parts on order; estimated 3 business days.', 'Teardown complete; no hidden damage found.', 'Frame measured within spec; proceeding with body work.', 'Waiting on OEM bumper cover; ETA 2 days.']) });
      estimateAt = estAt;
      if (main && main.wo.estimate_amount == null) main = { ...main, amount: undefined };

      if (s.rental && rentCov && !s.liability) {
        const daily = rentCov.daily_limit_amount ?? 30;
        if (chance(0.5)) {
          rental = engage('rental', bizAfter(accepted, 0.5, 3), adjuster, `Rental at up to ${Number(daily).toFixed(2)}/day while the insured vehicle is being repaired.`, {
            accepted: bizAfter(accepted, 1, 4), inProgress: start, completed: repairDone,
            estimate: Math.min(rentCov.limit_amount, daily * Math.max(3, Math.ceil(((repairDone?.getTime() ?? 0) - start.getTime()) / DAY) + 1)), estimateAt: repairDone,
          });
        } else if (repairDone) {
          const days = Math.max(3, Math.ceil((repairDone.getTime() - start.getTime()) / DAY) + 1);
          rentalReimb = { days, daily, amount: Math.min(rentCov.limit_amount, days * daily), at: repairDone };
        }
      }
    }
    if (s.totalLoss && s.rental && rentCov && !denied) {
      const daily = rentCov.daily_limit_amount ?? 30;
      rental = engage('rental', bizAfter(reviewAt, 1, 4), adjuster, `Rental at up to ${Number(daily).toFixed(2)}/day until the total-loss settlement is paid.`, { accepted: bizAfter(reviewAt, 2, 6), inProgress: bizAfter(reviewAt, 6, 20) });
    }

    // The adjuster records the estimate once the shop or appraiser has priced the loss.
    const parts: number[] = [];
    if (tow?.amount) parts.push(tow.amount);
    if (appraisal?.amount) parts.push(appraisal.amount);
    let acv = 0;
    if (s.totalLoss) {
      acv = roundTo(Number(vehicle.row.market_value), 50);
      parts.push(acv);
    } else if (main?.amount) parts.push(main.amount);
    if (rental?.amount) parts.push(rental.amount);
    if (rentalReimb) parts.push(rentalReimb.amount);
    const estimate = round2(parts.reduce((a, b) => a + b, 0));
    const estimateReady = s.totalLoss ? appraisal?.completedAt : main?.amount !== undefined ? estimateAt : undefined;
    let estimateSetAt: Date | undefined;
    if (!denied && estimateReady && estimateReady <= AS_OF && estimate > 0) {
      estimateSetAt = bizAfter(estimateReady, 0.5, 6);
      if (estimateSetAt > AS_OF) estimateSetAt = plusMin(AS_OF, -30);
      claim.estimated_amount = estimate;
      claim.updated_at = estimateSetAt;
      event(id, estimateSetAt, 'claim.estimate_updated', adjuster, `Estimate set to ${estimate.toFixed(2)} USD.`);
    }

    // ---- Terminal paths: cancelled from review, denied ----
    if (s.cancel) {
      const when = estimateSetAt ? bizAfter(estimateSetAt, 6, 60) : bizAfter(reviewAt, 24, 120);
      claim.status = 'cancelled';
      claim.cancel_reason = s.cancel.reason;
      claim.cancel_comment = s.cancel.comment;
      claim.updated_at = when;
      event(id, when, 'claim.cancelled', s.cancel.reason === 'customer_request' ? customerActor : adjuster, `Claim cancelled (${s.cancel.reason}): ${s.cancel.comment}`);
      for (const e of engagements) {
        if (['issued', 'accepted', 'in_progress'].includes(e.wo.status) && e.wo.created_at < when) {
          event(id, plusMin(when, 0.1), 'assignment.cancelled', adjuster, `Assignment ${e.wo.assignment_id} (work order ${e.wo.id}) cancelled: claim cancelled.`);
          e.wo.status = 'cancelled';
          e.wo.updated_at = plusMin(when, 0.1);
        }
      }
      if (s.cancel.reason === 'fraud_suspected') note(id, plusMin(when, -45), adjuster, 'internal', `SIU referral: ${s.cancel.comment}`);
      if (s.cancel.reason === 'customer_request') note(id, plusMin(when, -20), customerActor, 'customer', 'I would like to withdraw this claim. I will pay for the repair myself.');
      prevClaimId = id;
      continue;
    }
    if (denied) {
      const when = bizAfter(appraisal?.completedAt ?? reviewAt, 20, 120);
      claim.status = 'denied';
      claim.updated_at = when;
      note(id, plusMin(when, -30), adjuster, 'internal', `Coverage position: deny. ${s.denial}`);
      event(id, when, 'claim.status_changed', adjuster, 'Status changed from under_review to denied.');
      note(id, plusMin(when, 5), adjuster, 'customer', `We have completed our review and are unable to cover this loss. ${s.denial} A denial letter with your appeal rights has been mailed and emailed to you.`);
      for (const e of engagements) {
        if (['issued', 'accepted', 'in_progress'].includes(e.wo.status)) {
          event(id, plusMin(when, 1), 'assignment.cancelled', adjuster, `Assignment ${e.wo.assignment_id} (work order ${e.wo.id}) cancelled: claim denied.`);
          e.wo.status = 'cancelled';
          e.wo.updated_at = plusMin(when, 1);
        }
      }
      if (s.closeAfterDenial) {
        const closeAt = bizAfter(when, 24 * 30, 24 * 45);
        claim.status = 'closed';
        claim.updated_at = closeAt;
        event(id, closeAt, 'claim.status_changed', adjuster, 'Status changed from denied to closed. No appeal received within 30 days.');
      }
      prevClaimId = id;
      continue;
    }

    if (s.status === 'under_review') { prevClaimId = id; continue; }

    // ---- Approval ----
    if (!estimateSetAt) throw new Error(`Scenario ${s.status}/${s.type} reached approval without an estimate`);
    const approvedAt = bizAfter(estimateSetAt, 2, 26);
    if (approvedAt > AS_OF) throw new Error(`Approval after AS_OF for ${s.status}/${s.type}/${s.metro} (${lossDate})`);
    const approvedAmount = round2(estimate - deductible);
    claim.status = 'approved';
    claim.updated_at = approvedAt;
    event(id, approvedAt, 'claim.status_changed', adjuster, `Status changed from under_review to approved. Approved amount ${approvedAmount.toFixed(2)} USD (estimate ${estimate.toFixed(2)} USD less ${deductible.toFixed(2)} USD deductible).`);
    note(id, plusMin(approvedAt, int(3, 30)), adjuster, 'customer', s.totalLoss
      ? `Your claim has been approved as a total loss. The settlement is the actual cash value of ${acv.toFixed(2)} USD less your ${deductible.toFixed(2)} USD deductible.`
      : `Your claim has been approved for ${approvedAmount.toFixed(2)} USD after your ${deductible.toFixed(2)} USD deductible. We pay in-network vendors directly.`);

    // ---- Payments ----
    const oldStyle = createdAt < new Date('2025-09-01T00:00:00Z');
    interface PlannedPayment { type: string; payeeType: 'customer' | 'vendor'; payeeId: string; amount: number; after: Date; invoice?: string; memo: string; vendor?: Row }
    const planned: PlannedPayment[] = [];
    const vendorInvoice = (e: Engagement | undefined, amount: number, memo: (inv: string) => string, after: Date) => {
      if (!e || !e.amount) return;
      const inv = invoiceNumber(e.vendor, after);
      planned.push({ type: 'vendor_invoice', payeeType: 'vendor', payeeId: e.vendor.id, amount: round2(amount), after, invoice: inv, memo: memo(inv), vendor: e.vendor });
    };
    vendorInvoice(tow, tow?.amount ?? 0, (inv) => `Towing from ${lossLoc.addressLine1}, invoice ${inv}.`, bizAfter(approvedAt, 2, 30));
    vendorInvoice(appraisal, appraisal?.amount ?? 0, (inv) => `${s.totalLoss ? 'Total-loss valuation' : 'Vehicle appraisal'}, invoice ${inv}.`, bizAfter(approvedAt, 4, 40));
    if (s.totalLoss) {
      planned.push({ type: 'settlement', payeeType: 'customer', payeeId: hh.customer.id, amount: round2(acv - deductible), after: bizAfter(approvedAt, 1, 20),
        memo: `Total loss payout: ACV ${acv.toFixed(2)} less ${deductible.toFixed(2)} deductible.` });
    } else if (main?.amount) {
      const label = s.glassCost ? 'Windshield replacement' : s.liability ? 'Third-party vehicle repair (property damage liability)' : `${s.type[0].toUpperCase()}${s.type.slice(1)} repair`;
      vendorInvoice(main, main.amount - deductible, (inv) => `${label}, invoice ${inv}.`, bizAfter(main.completedAt ?? approvedAt, 6, 50));
    }
    if (rental?.amount) vendorInvoice(rental, rental.amount, (inv) => `Rental vehicle during repairs, invoice ${inv}.`, bizAfter(rental.completedAt ?? approvedAt, 6, 40));
    if (rentalReimb) {
      planned.push({ type: 'rental_reimbursement', payeeType: 'customer', payeeId: hh.customer.id, amount: rentalReimb.amount, after: bizAfter(rentalReimb.at, 8, 48),
        memo: `Rental reimbursement: ${rentalReimb.days} days at ${Number(rentalReimb.daily).toFixed(2)}/day.` });
    }
    const totalPlanned = round2(planned.reduce((a, p) => a + p.amount, 0));
    if (Math.abs(totalPlanned - approvedAmount) > 0.01) throw new Error(`Payments ${totalPlanned} != approved ${approvedAmount} for ${s.status}/${s.type}`);

    const issue = (p: PlannedPayment, opts: { status: string; createdAt: Date }) => {
      const customer = p.payeeType === 'customer';
      let pmId: string | null = null;
      let method = 'ach';
      if (customer) {
        if (oldStyle && chance(0.5)) method = 'check';
        else {
          let pm = customerPm.get(p.payeeId);
          if (!pm) {
            pm = addCustomerPm(ds, hh, plusH(opts.createdAt, -int(2, 60)), nextCustomerPm());
            customerPm.set(p.payeeId, pm);
          }
          pmId = pm.id;
          method = pm.type === 'debit_card' ? 'card' : 'ach';
        }
      } else pmId = vendorPmId(p.payeeId);
      const needsApproval = p.amount > (customer ? 10000 : 25000);
      const pay: Row = {
        id: tmpId('pay'), claim_id: id, type: p.type, payee_type: p.payeeType, payee_id: p.payeeId, payment_method_id: pmId, amount: p.amount, currency: 'USD',
        status: opts.status, method, invoice_number: p.invoice ?? null, memo: p.memo, created_by: adjuster.id, approved_by: null, approval_comment: null,
        cancel_reason: null, cancel_comment: null, settle_after: null, created_at: opts.createdAt, completed_at: null, updated_at: opts.createdAt,
      };
      ds.payments.push(pay);
      event(id, opts.createdAt, 'payment.created', adjuster, `Payment ${pay.id} of ${p.amount.toFixed(2)} USD (${p.type}) to ${p.payeeType} ${p.payeeId} created${needsApproval ? '; held for approval' : ''}.`);
      if (opts.status === 'pending_approval') return pay;
      let released = opts.createdAt;
      if (needsApproval) {
        released = bizAfter(opts.createdAt, 2, 20);
        pay.approved_by = R.SUPERVISOR;
        pay.approval_comment = pick(['Verified against approved settlement letter.', 'ACV valuation and title transfer confirmed.', 'Reviewed; amount matches approved estimate.']);
        event(id, released, 'payment.approved', { type: 'adjuster', id: R.SUPERVISOR }, `Payment ${pay.id} of ${p.amount.toFixed(2)} USD approved by ${R.SUPERVISOR}: ${pay.approval_comment}`);
      }
      if (opts.status === 'processing') { pay.updated_at = released; return pay; }
      const done = method === 'card' ? plusMin(released, int(20, 180)) : method === 'check' ? bizAfter(released, 24 * 5, 24 * 8) : bizAfter(released, 40, 64);
      pay.status = 'completed';
      pay.completed_at = done;
      pay.updated_at = done;
      event(id, done, 'payment.completed', PAYSYS, `Payment ${pay.id} of ${p.amount.toFixed(2)} USD to ${p.payeeType} ${p.payeeId} completed.`);
      return pay;
    };

    if (s.status === 'approved') {
      if (s.payments === 'pending_approval') {
        for (const p of planned) {
          if (p.type === 'settlement') issue(p, { status: 'pending_approval', createdAt: p.after > AS_OF ? plusH(AS_OF, -5) : p.after });
          else if (p.after <= plusH(AS_OF, -72)) issue(p, { status: 'completed', createdAt: p.after });
        }
      } else if (s.payments === 'processing') {
        const p = planned.find((x) => x.vendor?.type === 'glass')!;
        const when = p.after > AS_OF ? plusH(AS_OF, -3) : p.after;
        issue(p, { status: 'processing', createdAt: when });
      } else if (s.payments === 'partial') {
        for (const p of planned) if (p.vendor?.type === 'tow' || p.vendor?.type === 'appraisal') if (p.after <= plusH(AS_OF, -72)) issue(p, { status: 'completed', createdAt: p.after });
      }
      prevClaimId = id;
      continue;
    }

    // Settled / closed: everything is paid.
    let lastDone = approvedAt;
    for (const p of planned) {
      const pay = issue(p, { status: 'completed', createdAt: p.after });
      if (pay.completed_at > lastDone) lastDone = pay.completed_at;
      if (s.duplicatePayment && p.vendor?.type === 'repair') {
        // The same invoice was paid twice by mistake; the duplicate was refunded in full.
        const dupAt = plusMin(p.after, int(30, 300));
        const dup = issue({ ...p, memo: `${p.memo} (duplicate)` }, { status: 'completed', createdAt: dupAt });
        dup.memo = p.memo;
        const refundAt = bizAfter(dup.completed_at, 24, 72);
        const refundDone = bizAfter(refundAt, 30, 60);
        const refId = tmpId('ref');
        ds.refunds.push({ id: refId, payment_id: dup.id, amount: dup.amount, currency: 'USD', reason: 'duplicate', status: 'completed', created_by: adjuster.id, settle_after: null, created_at: refundAt, completed_at: refundDone });
        dup.status = 'refunded';
        dup.updated_at = refundDone;
        event(id, refundAt, 'refund.created', adjuster, `Refund ${refId} of ${dup.amount.toFixed(2)} USD (duplicate) requested on payment ${dup.id}.`);
        event(id, refundDone, 'refund.completed', PAYSYS, `Refund ${refId} of ${dup.amount.toFixed(2)} USD on payment ${dup.id} completed.`);
        note(id, plusMin(refundAt, -15), adjuster, 'internal', `Invoice ${p.invoice} was paid twice (${dup.id} duplicates the original). Requested a full refund from ${p.vendor!.name}.`);
        if (refundDone > lastDone) lastDone = refundDone;
      }
    }
    const settledAt = plusMin(lastDone, 0.2);
    claim.status = 'settled';
    claim.updated_at = settledAt;
    event(id, settledAt, 'claim.status_changed', PAYSYS, `Status changed from approved to settled. All approved amounts (${approvedAmount.toFixed(2)} USD) paid.`);
    if (s.status === 'closed') {
      const closeAt = bizAfter(settledAt, 24 * 10, 24 * 30);
      claim.status = 'closed';
      claim.updated_at = closeAt;
      event(id, closeAt, 'claim.status_changed', adjuster, 'Status changed from settled to closed.');
      note(id, plusMin(closeAt, -10), adjuster, 'internal', 'All payments issued and cleared; no open items. Closing file.');
    }
    prevClaimId = id;
  }

  for (const e of [...ds.claim_events, ...ds.claim_notes, ...ds.work_orders, ...ds.payments, ...ds.refunds]) {
    for (const k of ['at', 'created_at', 'updated_at', 'completed_at']) {
      if (e[k] instanceof Date && e[k] > AS_OF) throw new Error(`Seed timestamp ${k}=${e[k].toISOString()} is after AS_OF (${JSON.stringify(e).slice(0, 160)})`);
    }
  }
}

// ---- ID assignment ------------------------------------------------------------------------------

/** Ascending numbers with gaps where the item at `anchorIdx` gets exactly `anchorVal`. */
function anchored(n: number, anchorIdx: number, anchorVal: number, gap: [number, number]): number[] {
  const nums = new Array<number>(n);
  nums[anchorIdx] = anchorVal;
  for (let i = anchorIdx - 1; i >= 0; i--) nums[i] = nums[i + 1] - int(gap[0], gap[1]);
  for (let i = anchorIdx + 1; i < n; i++) nums[i] = nums[i - 1] + int(gap[0], gap[1]);
  return nums;
}

function finalizeIds(ds: Dataset) {
  const map = new Map<string, string>();
  const byTime = (a: Row, b: Row) => a.created_at.getTime() - b.created_at.getTime();

  // Claims: numbered per year in filing order; Marisol's is clm_2026-000417.
  const claims = [...ds.claims].sort(byTime);
  for (const year of [...new Set(claims.map((c) => c.created_at.getUTCFullYear()))]) {
    const inYear = claims.filter((c) => c.created_at.getUTCFullYear() === year);
    const anchorIdx = inYear.findIndex((c) => c.id === 'clm_2026-000417');
    const nums = anchorIdx >= 0 ? anchored(inYear.length, anchorIdx, 417, [3, 9]) : anchored(inYear.length, 0, int(140, 190), [5, 14]);
    inYear.forEach((c, i) => { if (!c.id.startsWith('clm_')) map.set(c.id, `clm_${year}-${String(nums[i]).padStart(6, '0')}`); });
  }

  const assign = (rows: Row[], field: string, prefix: string, anchorId: string, anchorVal: number, gap: [number, number], pad = 0, sortKey = byTime) => {
    const sorted = [...rows].sort(sortKey);
    const idx = Math.max(0, sorted.findIndex((r) => r[field] === anchorId));
    const nums = anchored(sorted.length, idx, anchorVal, gap);
    sorted.forEach((r, i) => { if (r[field].startsWith('tmp_')) map.set(r[field], `${prefix}${String(nums[i]).padStart(pad, '0')}`); });
    return Math.max(...nums);
  };
  const maxWo = assign(ds.work_orders, 'id', 'wo_', 'wo_9001', 9001, [1, 4]);
  const maxAsg = assign(ds.work_orders, 'assignment_id', 'asg_', 'asg_5521', 5521, [1, 3]);
  const maxPay = assign(ds.payments, 'id', 'pay_', 'pay_90311', 90311, [1, 3]);
  const maxRef = assign(ds.refunds, 'id', 'ref_', 'ref_2001', 2001, [1, 5]);
  // Notes: note_001 is Marisol's first note (per the spec examples); the rest follow in time order.
  const notes = ds.claim_notes.filter((n) => n.id !== 'note_001').sort(byTime);
  notes.forEach((n, i) => map.set(n.id, `note_${String(i + 2).padStart(3, '0')}`));

  const replace = (v: any): any => (typeof v === 'string' ? v.replace(/tmp_[a-z]+_\d+/g, (m) => map.get(m) ?? m) : v);
  for (const table of ['claims', 'coverage_verifications', 'claim_notes', 'claim_events', 'work_orders', 'payments', 'refunds'] as const) {
    for (const row of ds[table]) for (const k of Object.keys(row)) row[k] = replace(row[k]);
  }

  const claimNums2026 = ds.claims.filter((c) => c.id.startsWith('clm_2026-')).map((c) => Number(c.id.slice(9)));
  ds.sequences = {
    claim_seq: Math.max(...claimNums2026),
    note_seq: notes.length + 1,
    work_order_seq: maxWo,
    assignment_seq: maxAsg,
    payment_seq: maxPay,
    refund_seq: maxRef,
    vendor_seq: 5099,
    driver_seq: Math.max(...ds.drivers.map((d) => Number(d.id.slice(4)))),
    customer_vehicle_seq: 9900,
    payment_method_seq: Math.max(...ds.payment_methods.filter((p) => p.payee_type === 'customer').map((p) => Number(p.id.slice(3)))),
  };
}
