import * as core from '../../../../core';
import { NoteCreateVisibility, noteCreateVisibility } from './NoteCreateVisibility';
import { NoteCreate } from '../client/requests/NoteCreate';

export type { NoteCreate };

/**
 * Cast schema for the NoteCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const noteCreate = core.cast.identity<NoteCreate>();

/**
 * Cast schema for mapping API responses to the NoteCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const noteCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['visibility', 'body']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return { ...__extras, visibility: raw['visibility'], body: raw['body'] };
  },
  ['body'],
);

/**
 * Cast schema for mapping the NoteCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const noteCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return { visibility: raw['visibility'], body: raw['body'] };
  },
  ['body'],
);
