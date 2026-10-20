import * as core from '../../../../core';
import {
  Assignment,
  assignment,
  assignmentRequest,
  assignmentResponse,
} from '../../../types/Assignment';

export interface ListClaimAssignmentsResponse {
  data: Assignment[];
}

/**
 * Cast schema for the ListClaimAssignmentsResponse model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const listClaimAssignmentsResponse = core.cast.identity<ListClaimAssignmentsResponse>();

/**
 * Cast schema for mapping API responses to the ListClaimAssignmentsResponse application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const listClaimAssignmentsResponseResponse = core.cast.object(
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
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : assignmentResponse.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);

/**
 * Cast schema for mapping the ListClaimAssignmentsResponse application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const listClaimAssignmentsResponseRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : assignmentRequest.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);
