import { PaymentStatus, paymentStatus } from '../../../../types/PaymentStatus';

export interface ListPaymentsRequest {
  claimId?: string;
  payeeId?: string;
  status?: PaymentStatus;
  limit?: number;
  cursor?: string;
}
