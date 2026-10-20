import * as core from '../../../../core';
import { ApprovePaymentRequest } from '../client/requests/ApprovePaymentRequest';

export type { ApprovePaymentRequest };

/**
 * Cast schema for the ApprovePaymentRequest model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const approvePaymentRequest = core.cast.identity<ApprovePaymentRequest>();

/**
 * Cast schema for mapping API responses to the ApprovePaymentRequest application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const approvePaymentRequestResponse = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  const __declaredKeys = new Set<string>(['comment']);
  const __extras: { [key: string]: unknown } = {};
  for (const __key of globalThis.Object.keys(raw as object)) {
    if (!__declaredKeys.has(__key)) {
      __extras[__key] = (raw as { [key: string]: unknown })[__key];
    }
  }
  return { ...__extras, comment: raw['comment'] };
}, []);

/**
 * Cast schema for mapping the ApprovePaymentRequest application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const approvePaymentRequestRequest = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  return { comment: raw['comment'] };
}, []);
