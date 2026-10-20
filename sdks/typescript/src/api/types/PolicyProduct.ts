import * as core from '../../core';

export const PolicyProduct = {
  PersonalAuto: 'personal_auto',
  CommercialAuto: 'commercial_auto',
  Motorcycle: 'motorcycle',
  ClassicCar: 'classic_car',
} as const;

export type PolicyProduct = (typeof PolicyProduct)[keyof typeof PolicyProduct];

export const policyProduct = core.cast.identity<PolicyProduct>();
