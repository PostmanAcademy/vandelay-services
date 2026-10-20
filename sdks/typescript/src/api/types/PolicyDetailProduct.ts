import * as core from '../../core';

export const PolicyDetailProduct = {
  PersonalAuto: 'personal_auto',
  CommercialAuto: 'commercial_auto',
  Motorcycle: 'motorcycle',
  ClassicCar: 'classic_car',
} as const;

export type PolicyDetailProduct = (typeof PolicyDetailProduct)[keyof typeof PolicyDetailProduct];

export const policyDetailProduct = core.cast.identity<PolicyDetailProduct>();
