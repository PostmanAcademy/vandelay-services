import * as core from '../../core';
import { PayeeType, payeeType } from './PayeeType';

export interface Payee {
  type: PayeeType;
  id: string;
}

export namespace Payee {
  export type Type = PayeeType;
  export const Type = PayeeType;
}

/**
 * Cast schema for the Payee model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const payee = core.cast.identity<Payee>();

/**
 * Cast schema for mapping API responses to the Payee application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const payeeResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['type', 'id']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return { ...__extras, type: raw['type'], id: raw['id'] };
  },
  ['type', 'id'],
);

/**
 * Cast schema for mapping the Payee application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const payeeRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return { type: raw['type'], id: raw['id'] };
  },
  ['type', 'id'],
);
