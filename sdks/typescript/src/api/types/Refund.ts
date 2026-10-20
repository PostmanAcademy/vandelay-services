import * as core from '../../core';
import { Money, money, moneyRequest, moneyResponse } from './Money';
import { RefundReason, refundReason } from './RefundReason';
import { RefundStatus, refundStatus } from './RefundStatus';

export interface Refund {
  id: string;
  paymentId: string;
  amount: Money;
  reason: RefundReason;
  status: RefundStatus;
  createdAt: string;
}

export namespace Refund {
  export type Reason = RefundReason;
  export const Reason = RefundReason;
  export type Status = RefundStatus;
  export const Status = RefundStatus;
}

/**
 * Cast schema for the Refund model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const refund = core.cast.identity<Refund>();

/**
 * Cast schema for mapping API responses to the Refund application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const refundResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'paymentId',
      'amount',
      'reason',
      'status',
      'createdAt',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      id: raw['id'],
      paymentId: raw['paymentId'],
      amount: raw['amount'] == null ? raw['amount'] : moneyResponse.parse(raw['amount']),
      reason: raw['reason'],
      status: raw['status'],
      createdAt: raw['createdAt'],
    };
  },
  ['id', 'paymentId', 'amount', 'reason', 'status', 'createdAt'],
);

/**
 * Cast schema for mapping the Refund application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const refundRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      paymentId: raw['paymentId'],
      amount: raw['amount'] == null ? raw['amount'] : moneyRequest.parse(raw['amount']),
      reason: raw['reason'],
      status: raw['status'],
      createdAt: raw['createdAt'],
    };
  },
  ['id', 'paymentId', 'amount', 'reason', 'status', 'createdAt'],
);
