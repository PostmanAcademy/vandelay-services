import * as core from '../../../../core';

export const VendorUpdateStatus = {
  Active: 'active',
  Suspended: 'suspended',
  Terminated: 'terminated',
} as const;

export type VendorUpdateStatus = (typeof VendorUpdateStatus)[keyof typeof VendorUpdateStatus];

export const vendorUpdateStatus = core.cast.identity<VendorUpdateStatus>();
