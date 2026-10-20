import { PolicyStatus, policyStatus } from '../../../../types/PolicyStatus';

export interface ListPoliciesRequest {
  customerId?: string;
  status?: PolicyStatus;
  vin?: string;
  limit?: number;
  cursor?: string;
}
