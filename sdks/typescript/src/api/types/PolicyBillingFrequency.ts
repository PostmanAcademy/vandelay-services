import * as core from '../../core';

export const PolicyBillingFrequency = {
  Monthly: 'monthly',
  Quarterly: 'quarterly',
  Semiannual: 'semiannual',
  Annual: 'annual',
} as const;

export type PolicyBillingFrequency =
  (typeof PolicyBillingFrequency)[keyof typeof PolicyBillingFrequency];

export const policyBillingFrequency = core.cast.identity<PolicyBillingFrequency>();
