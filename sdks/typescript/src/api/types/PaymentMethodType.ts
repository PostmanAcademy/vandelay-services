import * as core from '../../core';

export const PaymentMethodType = {
  BankAccount: 'bank_account',
  DebitCard: 'debit_card',
} as const;

export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

export const paymentMethodType = core.cast.identity<PaymentMethodType>();
