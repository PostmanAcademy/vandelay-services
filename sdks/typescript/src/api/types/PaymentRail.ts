import * as core from '../../core';

export const PaymentRail = {
  Ach: 'ach',
  Check: 'check',
  Card: 'card',
  Wire: 'wire',
} as const;

export type PaymentRail = (typeof PaymentRail)[keyof typeof PaymentRail];

export const paymentRail = core.cast.identity<PaymentRail>();
