import * as core from '../../../../core';

export const RefundCreateReason = {
  Overpayment: 'overpayment',
  Duplicate: 'duplicate',
  ClaimReversed: 'claim_reversed',
  Other: 'other',
} as const;

export type RefundCreateReason = (typeof RefundCreateReason)[keyof typeof RefundCreateReason];

export const refundCreateReason = core.cast.identity<RefundCreateReason>();
