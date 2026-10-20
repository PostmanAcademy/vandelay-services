import { ClaimType, claimType } from '../../../../types/ClaimType';
import { Address, address } from '../../../../types/Address';

export interface ClaimCreate {
  'Idempotency-Key'?: string;
  customerId: string;
  policyId: string;
  vehicleId?: string;
  type: ClaimType;
  lossDate: string;
  lossLocation?: Address;
  description: string;
  drivable?: boolean;
  injuries?: boolean;
  policeReportNumber?: string;
  submit?: boolean;
}
