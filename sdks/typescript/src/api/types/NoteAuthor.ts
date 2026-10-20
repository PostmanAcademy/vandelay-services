import * as core from '../../core';
import { NoteAuthorType, noteAuthorType } from './NoteAuthorType';

export interface NoteAuthor {
  type: NoteAuthorType;
  id: string;
}

export namespace NoteAuthor {
  export type Type = NoteAuthorType;
  export const Type = NoteAuthorType;
}

/**
 * Cast schema for the NoteAuthor model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const noteAuthor = core.cast.identity<NoteAuthor>();

/**
 * Cast schema for mapping API responses to the NoteAuthor application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const noteAuthorResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['type', 'id']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return { ...__extras, type: raw['type'], id: raw['id'] };
  },
  ['type', 'id'],
);

/**
 * Cast schema for mapping the NoteAuthor application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const noteAuthorRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return { type: raw['type'], id: raw['id'] };
  },
  ['type', 'id'],
);
