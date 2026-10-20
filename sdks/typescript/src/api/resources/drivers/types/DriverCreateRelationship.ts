import * as core from '../../../../core';

export const DriverCreateRelationship = {
  Self: 'self',
  Spouse: 'spouse',
  Child: 'child',
  Other: 'other',
} as const;

export type DriverCreateRelationship =
  (typeof DriverCreateRelationship)[keyof typeof DriverCreateRelationship];

export const driverCreateRelationship = core.cast.identity<DriverCreateRelationship>();
