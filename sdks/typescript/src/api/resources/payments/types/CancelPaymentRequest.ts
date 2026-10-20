import * as core from '../../../../core';
import {
  CancelPaymentRequestReason,
  cancelPaymentRequestReason,
} from './CancelPaymentRequestReason';
import { CancelPaymentRequest } from '../client/requests/CancelPaymentRequest';

export type { CancelPaymentRequest };

/**
 * Cast schema for the CancelPaymentRequest model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const cancelPaymentRequest = core.cast.identity<CancelPaymentRequest>();

/**
 * Cast schema for mapping API responses to the CancelPaymentRequest application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const cancelPaymentRequestResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['reason', 'comment']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return { ...__extras, reason: raw['reason'], comment: raw['comment'] };
  },
  ['reason'],
);

/**
 * Cast schema for mapping the CancelPaymentRequest application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const cancelPaymentRequestRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return { reason: raw['reason'], comment: raw['comment'] };
  },
  ['reason'],
);
