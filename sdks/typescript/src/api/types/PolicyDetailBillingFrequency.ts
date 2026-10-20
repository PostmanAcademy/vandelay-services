import * as core from '../../core';

export const PolicyDetailBillingFrequency = {
  Monthly: 'monthly',
  Quarterly: 'quarterly',
  Semiannual: 'semiannual',
  Annual: 'annual',
} as const;

export type PolicyDetailBillingFrequency =
  (typeof PolicyDetailBillingFrequency)[keyof typeof PolicyDetailBillingFrequency];

export const policyDetailBillingFrequency = core.cast.identity<PolicyDetailBillingFrequency>();
