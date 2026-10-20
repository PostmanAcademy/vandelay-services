import { ClaimStatus, claimStatus } from '../../../../types/ClaimStatus';

export interface ListClaimsRequest {
  status?: ClaimStatus;
  customerId?: string;
  policyId?: string;
  limit?: number;
  cursor?: string;
}
