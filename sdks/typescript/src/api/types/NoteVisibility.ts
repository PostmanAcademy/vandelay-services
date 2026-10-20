import * as core from '../../core';

export const NoteVisibility = {
  Internal: 'internal',
  Customer: 'customer',
} as const;

export type NoteVisibility = (typeof NoteVisibility)[keyof typeof NoteVisibility];

export const noteVisibility = core.cast.identity<NoteVisibility>();
