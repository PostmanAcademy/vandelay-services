import * as core from '../../core';

export interface Address {
  addressLine1: string;
  addressLine2?: string | undefined;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Cast schema for the Address model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const address = core.cast.identity<Address>();

/**
 * Cast schema for mapping API responses to the Address application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const addressResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'postalCode',
      'country',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      addressLine1: raw['addressLine1'],
      addressLine2: raw['addressLine2'],
      city: raw['city'],
      state: raw['state'],
      postalCode: raw['postalCode'],
      country: raw['country'],
    };
  },
  ['addressLine1', 'city', 'state', 'postalCode', 'country'],
);

/**
 * Cast schema for mapping the Address application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const addressRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      addressLine1: raw['addressLine1'],
      addressLine2: raw['addressLine2'],
      city: raw['city'],
      state: raw['state'],
      postalCode: raw['postalCode'],
      country: raw['country'],
    };
  },
  ['addressLine1', 'city', 'state', 'postalCode', 'country'],
);
