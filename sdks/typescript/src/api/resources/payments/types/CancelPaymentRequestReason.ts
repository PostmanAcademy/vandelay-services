import * as core from '../../../../core';

export const CancelPaymentRequestReason = {
  Duplicate: 'duplicate',
  IncorrectAmount: 'incorrect_amount',
  IncorrectPayee: 'incorrect_payee',
  ClaimCancelled: 'claim_cancelled',
  Other: 'other',
} as const;

export type CancelPaymentRequestReason =
  (typeof CancelPaymentRequestReason)[keyof typeof CancelPaymentRequestReason];

export const cancelPaymentRequestReason = core.cast.identity<CancelPaymentRequestReason>();
