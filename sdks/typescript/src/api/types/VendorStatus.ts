import * as core from '../../core';

export const VendorStatus = {
  Pending: 'pending',
  Active: 'active',
  Suspended: 'suspended',
  Terminated: 'terminated',
} as const;

export type VendorStatus = (typeof VendorStatus)[keyof typeof VendorStatus];

export const vendorStatus = core.cast.identity<VendorStatus>();
