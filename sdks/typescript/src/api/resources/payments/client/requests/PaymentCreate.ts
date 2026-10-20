import { PaymentCreateType, paymentCreateType } from '../../types/PaymentCreateType';
import { Payee, payee } from '../../../../types/Payee';
import { Money, money } from '../../../../types/Money';

export interface PaymentCreate {
  'Idempotency-Key': string;
  claimId: string;
  type: PaymentCreateType;
  payee: Payee;
  paymentMethodId: string;
  amount: Money;
  invoiceNumber?: string;
  memo?: string;
}

export namespace PaymentCreate {
  export type Type = PaymentCreateType;
  export const Type = PaymentCreateType;
}
