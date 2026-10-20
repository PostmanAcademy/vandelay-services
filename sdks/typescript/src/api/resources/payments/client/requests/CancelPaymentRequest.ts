import {
  CancelPaymentRequestReason,
  cancelPaymentRequestReason,
} from '../../types/CancelPaymentRequestReason';

export interface CancelPaymentRequest {
  paymentId: string;
  reason: CancelPaymentRequestReason;
  comment?: string;
}

export namespace CancelPaymentRequest {
  export type Reason = CancelPaymentRequestReason;
  export const Reason = CancelPaymentRequestReason;
}
