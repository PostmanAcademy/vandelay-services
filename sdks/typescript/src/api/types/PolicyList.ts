import * as core from '../../core';
import { Policy, policy, policyRequest, policyResponse } from './Policy';

export interface PolicyList {
  data: Policy[];
  nextCursor?: string | null | undefined;
}

/**
 * Cast schema for the PolicyList model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const policyList = core.cast.identity<PolicyList>();

/**
 * Cast schema for mapping API responses to the PolicyList application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const policyListResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['data', 'nextCursor']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : policyResponse.parse(v)))
        : (raw['data'] as any),
      nextCursor: raw['nextCursor'],
    };
  },
  ['data'],
);

/**
 * Cast schema for mapping the PolicyList application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const policyListRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : policyRequest.parse(v)))
        : (raw['data'] as any),
      nextCursor: raw['nextCursor'],
    };
  },
  ['data'],
);
