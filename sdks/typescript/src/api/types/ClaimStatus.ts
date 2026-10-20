import * as core from '../../core';

export const ClaimStatus = {
  Draft: 'draft',
  Submitted: 'submitted',
  UnderReview: 'under_review',
  Approved: 'approved',
  Denied: 'denied',
  Settled: 'settled',
  Closed: 'closed',
  Cancelled: 'cancelled',
} as const;

export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];

export const claimStatus = core.cast.identity<ClaimStatus>();
