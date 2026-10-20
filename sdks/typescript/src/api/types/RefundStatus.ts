import * as core from '../../core';

export const RefundStatus = {
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus];

export const refundStatus = core.cast.identity<RefundStatus>();
