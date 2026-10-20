import * as core from '../../../../core';

export const NoteCreateVisibility = {
  Internal: 'internal',
  Customer: 'customer',
} as const;

export type NoteCreateVisibility = (typeof NoteCreateVisibility)[keyof typeof NoteCreateVisibility];

export const noteCreateVisibility = core.cast.identity<NoteCreateVisibility>();
