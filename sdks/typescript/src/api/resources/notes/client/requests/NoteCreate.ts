import { NoteCreateVisibility, noteCreateVisibility } from '../../types/NoteCreateVisibility';

export interface NoteCreate {
  claimId: string;
  visibility?: NoteCreateVisibility;
  body: string;
}

export namespace NoteCreate {
  export type Visibility = NoteCreateVisibility;
  export const Visibility = NoteCreateVisibility;
}
