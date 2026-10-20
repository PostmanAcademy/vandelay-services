import * as core from '../../../../core';

export const CancelRequestReason = {
  CustomerRequest: 'customer_request',
  Duplicate: 'duplicate',
  FraudSuspected: 'fraud_suspected',
  PolicyIssue: 'policy_issue',
  Other: 'other',
} as const;

export type CancelRequestReason = (typeof CancelRequestReason)[keyof typeof CancelRequestReason];

export const cancelRequestReason = core.cast.identity<CancelRequestReason>();
