import * as core from '../../../../core';

export const PaymentMethodCreateType = {
  BankAccount: 'bank_account',
  DebitCard: 'debit_card',
} as const;

export type PaymentMethodCreateType =
  (typeof PaymentMethodCreateType)[keyof typeof PaymentMethodCreateType];

export const paymentMethodCreateType = core.cast.identity<PaymentMethodCreateType>();
