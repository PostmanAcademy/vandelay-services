import * as core from '../../core';

export const PayeeType = {
  Customer: 'customer',
  Vendor: 'vendor',
} as const;

export type PayeeType = (typeof PayeeType)[keyof typeof PayeeType];

export const payeeType = core.cast.identity<PayeeType>();
