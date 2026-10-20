import { ClaimStatus, claimStatus } from '../../../../types/ClaimStatus';
import { Money, money } from '../../../../types/Money';

export interface ClaimUpdate {
  claimId: string;
  status?: ClaimStatus;
  description?: string;
  assignedAdjusterId?: string;
  estimatedAmount?: Money;
}
