import * as core from '../../core';

export const ClaimType = {
  Collision: 'collision',
  Comprehensive: 'comprehensive',
  Theft: 'theft',
  Glass: 'glass',
  Vandalism: 'vandalism',
  Weather: 'weather',
  Liability: 'liability',
  Other: 'other',
} as const;

export type ClaimType = (typeof ClaimType)[keyof typeof ClaimType];

export const claimType = core.cast.identity<ClaimType>();
