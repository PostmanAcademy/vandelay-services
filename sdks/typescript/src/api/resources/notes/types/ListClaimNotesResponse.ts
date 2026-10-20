import * as core from '../../../../core';
import { Note, note, noteRequest, noteResponse } from '../../../types/Note';

export interface ListClaimNotesResponse {
  data: Note[];
}

/**
 * Cast schema for the ListClaimNotesResponse model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const listClaimNotesResponse = core.cast.identity<ListClaimNotesResponse>();

/**
 * Cast schema for mapping API responses to the ListClaimNotesResponse application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const listClaimNotesResponseResponse = core.cast.object(
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
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : noteResponse.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);

/**
 * Cast schema for mapping the ListClaimNotesResponse application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const listClaimNotesResponseRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : noteRequest.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);
