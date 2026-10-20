import * as core from '../../core';

export const VendorType = {
  Repair: 'repair',
  Tow: 'tow',
  Rental: 'rental',
  Glass: 'glass',
  Appraisal: 'appraisal',
} as const;

export type VendorType = (typeof VendorType)[keyof typeof VendorType];

export const vendorType = core.cast.identity<VendorType>();
