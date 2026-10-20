import * as core from '../../core';

export const DriverRelationship = {
  Self: 'self',
  Spouse: 'spouse',
  Child: 'child',
  Other: 'other',
} as const;

export type DriverRelationship = (typeof DriverRelationship)[keyof typeof DriverRelationship];

export const driverRelationship = core.cast.identity<DriverRelationship>();
