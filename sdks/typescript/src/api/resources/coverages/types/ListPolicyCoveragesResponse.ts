import * as core from '../../../../core';
import { Coverage, coverage, coverageRequest, coverageResponse } from '../../../types/Coverage';

export interface ListPolicyCoveragesResponse {
  data: Coverage[];
}

/**
 * Cast schema for the ListPolicyCoveragesResponse model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const listPolicyCoveragesResponse = core.cast.identity<ListPolicyCoveragesResponse>();

/**
 * Cast schema for mapping API responses to the ListPolicyCoveragesResponse application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const listPolicyCoveragesResponseResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['data']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : coverageResponse.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);

/**
 * Cast schema for mapping the ListPolicyCoveragesResponse application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const listPolicyCoveragesResponseRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : coverageRequest.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);
