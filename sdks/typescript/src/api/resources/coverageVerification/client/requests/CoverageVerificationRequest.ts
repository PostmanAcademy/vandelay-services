import {
  CoverageVerificationRequestClaimType,
  coverageVerificationRequestClaimType,
} from '../../types/CoverageVerificationRequestClaimType';

export interface CoverageVerificationRequest {
  policyId: string;
  lossDate: string;
  claimType: CoverageVerificationRequestClaimType;
  vehicleId?: string;
  driverId?: string;
}

export namespace CoverageVerificationRequest {
  export type ClaimType = CoverageVerificationRequestClaimType;
  export const ClaimType = CoverageVerificationRequestClaimType;
}
