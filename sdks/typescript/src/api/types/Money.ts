import * as core from '../../core';

export interface Money {
  amount: number;
  currency: string;
}

/**
 * Cast schema for the Money model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const money = core.cast.identity<Money>();

/**
 * Cast schema for mapping API responses to the Money application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const moneyResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['amount', 'currency']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return { ...__extras, amount: raw['amount'], currency: raw['currency'] };
  },
  ['amount', 'currency'],
);

/**
 * Cast schema for mapping the Money application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const moneyRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return { amount: raw['amount'], currency: raw['currency'] };
  },
  ['amount', 'currency'],
);
