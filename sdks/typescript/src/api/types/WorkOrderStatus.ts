import * as core from '../../core';

export const WorkOrderStatus = {
  Issued: 'issued',
  Accepted: 'accepted',
  Declined: 'declined',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;

export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

export const workOrderStatus = core.cast.identity<WorkOrderStatus>();
