import * as core from '../../core';

export const CustomerStatus = {
  Active: 'active',
  Inactive: 'inactive',
  Suspended: 'suspended',
} as const;

export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const customerStatus = core.cast.identity<CustomerStatus>();
