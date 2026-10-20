import * as core from '../../../../core';

export const CoverageVerificationRequestClaimType = {
  Collision: 'collision',
  Comprehensive: 'comprehensive',
  Theft: 'theft',
  Glass: 'glass',
  Vandalism: 'vandalism',
  Weather: 'weather',
  Liability: 'liability',
  Other: 'other',
} as const;

export type CoverageVerificationRequestClaimType =
  (typeof CoverageVerificationRequestClaimType)[keyof typeof CoverageVerificationRequestClaimType];

export const coverageVerificationRequestClaimType =
  core.cast.identity<CoverageVerificationRequestClaimType>();
