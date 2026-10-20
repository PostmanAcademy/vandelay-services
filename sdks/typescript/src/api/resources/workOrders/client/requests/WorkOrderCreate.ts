import { VendorType, vendorType } from '../../../../types/VendorType';

export interface WorkOrderCreate {
  'Idempotency-Key'?: string;
  claimId: string;
  vendorId: string;
  type: VendorType;
  scheduledFor?: string;
  instructions?: string;
}
