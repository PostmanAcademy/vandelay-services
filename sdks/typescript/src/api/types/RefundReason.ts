import * as core from '../../core';

export const RefundReason = {
  Overpayment: 'overpayment',
  Duplicate: 'duplicate',
  ClaimReversed: 'claim_reversed',
  Other: 'other',
} as const;

export type RefundReason = (typeof RefundReason)[keyof typeof RefundReason];

export const refundReason = core.cast.identity<RefundReason>();
