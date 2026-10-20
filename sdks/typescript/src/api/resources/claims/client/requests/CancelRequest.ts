import { CancelRequestReason, cancelRequestReason } from '../../types/CancelRequestReason';

export interface CancelRequest {
  claimId: string;
  reason: CancelRequestReason;
  comment?: string;
}

export namespace CancelRequest {
  export type Reason = CancelRequestReason;
  export const Reason = CancelRequestReason;
}
