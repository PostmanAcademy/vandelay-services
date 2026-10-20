import { WorkOrderStatus, workOrderStatus } from '../../../../types/WorkOrderStatus';
import { Money, money } from '../../../../types/Money';

export interface WorkOrderUpdate {
  workOrderId: string;
  status?: WorkOrderStatus;
  estimate?: Money;
  scheduledFor?: string;
  notes?: string;
}
