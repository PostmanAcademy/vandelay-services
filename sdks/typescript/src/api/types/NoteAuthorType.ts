import * as core from '../../core';

export const NoteAuthorType = {
  Customer: 'customer',
  Adjuster: 'adjuster',
  Vendor: 'vendor',
  System: 'system',
} as const;

export type NoteAuthorType = (typeof NoteAuthorType)[keyof typeof NoteAuthorType];

export const noteAuthorType = core.cast.identity<NoteAuthorType>();
