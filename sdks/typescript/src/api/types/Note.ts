import * as core from '../../core';
import { NoteAuthor, noteAuthor, noteAuthorRequest, noteAuthorResponse } from './NoteAuthor';
import { NoteVisibility, noteVisibility } from './NoteVisibility';
import { NoteAuthorType } from './NoteAuthorType';

export interface Note {
  id: string;
  author: NoteAuthor;
  visibility: NoteVisibility;
  body: string;
  createdAt: string;
}

export namespace Note {
  export interface Author {
    type: NoteAuthor['type'];
    id: NoteAuthor['id'];
  }
  export namespace Author {
    export type Type = NoteAuthorType;
    export const Type = NoteAuthorType;
  }
  export type Visibility = NoteVisibility;
  export const Visibility = NoteVisibility;
}

/**
 * Cast schema for the Note model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const note = core.cast.identity<Note>();

/**
 * Cast schema for mapping API responses to the Note application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const noteResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['id', 'author', 'visibility', 'body', 'createdAt']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      id: raw['id'],
      author: raw['author'] == null ? raw['author'] : noteAuthorResponse.parse(raw['author']),
      visibility: raw['visibility'],
      body: raw['body'],
      createdAt: raw['createdAt'],
    };
  },
  ['id', 'author', 'visibility', 'body', 'createdAt'],
);

/**
 * Cast schema for mapping the Note application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const noteRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      author: raw['author'] == null ? raw['author'] : noteAuthorRequest.parse(raw['author']),
      visibility: raw['visibility'],
      body: raw['body'],
      createdAt: raw['createdAt'],
    };
  },
  ['id', 'author', 'visibility', 'body', 'createdAt'],
);
