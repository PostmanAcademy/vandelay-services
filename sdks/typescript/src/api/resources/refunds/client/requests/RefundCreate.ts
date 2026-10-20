import { Money, money } from '../../../../types/Money';
import { RefundCreateReason, refundCreateReason } from '../../types/RefundCreateReason';

export interface RefundCreate {
  paymentId: string;
  'Idempotency-Key': string;
  amount: Money;
  reason: RefundCreateReason;
}

export namespace RefundCreate {
  export type Reason = RefundCreateReason;
  export const Reason = RefundCreateReason;
}
