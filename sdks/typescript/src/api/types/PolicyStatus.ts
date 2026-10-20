import * as core from '../../core';

export const PolicyStatus = {
  Quoted: 'quoted',
  Active: 'active',
  Lapsed: 'lapsed',
  Cancelled: 'cancelled',
  Expired: 'expired',
} as const;

export type PolicyStatus = (typeof PolicyStatus)[keyof typeof PolicyStatus];

export const policyStatus = core.cast.identity<PolicyStatus>();
