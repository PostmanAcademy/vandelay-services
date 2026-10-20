import * as core from '../../core';

export const PaymentStatus = {
  PendingApproval: 'pending_approval',
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled',
  Refunded: 'refunded',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const paymentStatus = core.cast.identity<PaymentStatus>();
