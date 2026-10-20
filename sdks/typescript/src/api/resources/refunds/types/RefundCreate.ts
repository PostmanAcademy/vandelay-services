import * as core from '../../../../core';
import { Money, money, moneyRequest, moneyResponse } from '../../../types/Money';
import { RefundCreateReason, refundCreateReason } from './RefundCreateReason';
import { RefundCreate } from '../client/requests/RefundCreate';

export type { RefundCreate };

/**
 * Cast schema for the RefundCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const refundCreate = core.cast.identity<RefundCreate>();

/**
 * Cast schema for mapping API responses to the RefundCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const refundCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['amount', 'reason']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      amount: raw['amount'] == null ? raw['amount'] : moneyResponse.parse(raw['amount']),
      reason: raw['reason'],
    };
  },
  ['amount', 'reason'],
);

/**
 * Cast schema for mapping the RefundCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const refundCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      amount: raw['amount'] == null ? raw['amount'] : moneyRequest.parse(raw['amount']),
      reason: raw['reason'],
    };
  },
  ['amount', 'reason'],
);
