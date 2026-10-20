import { WorkOrderStatus, workOrderStatus } from '../../../../types/WorkOrderStatus';

export interface ListWorkOrdersRequest {
  vendorId?: string;
  claimId?: string;
  status?: WorkOrderStatus;
  limit?: number;
  cursor?: string;
}
