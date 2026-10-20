import * as core from '../../../../core';
import { CancelRequestReason, cancelRequestReason } from './CancelRequestReason';
import { CancelRequest } from '../client/requests/CancelRequest';

export type { CancelRequest };

/**
 * Cast schema for the CancelRequest model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const cancelRequest = core.cast.identity<CancelRequest>();

/**
 * Cast schema for mapping API responses to the CancelRequest application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const cancelRequestResponse = core.cast.object(
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
 * Cast schema for mapping the CancelRequest application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const cancelRequestRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return { reason: raw['reason'], comment: raw['comment'] };
  },
  ['reason'],
);
