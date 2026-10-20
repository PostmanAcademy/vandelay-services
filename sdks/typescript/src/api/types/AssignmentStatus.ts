import * as core from '../../core';

export const AssignmentStatus = {
  Requested: 'requested',
  Accepted: 'accepted',
  Declined: 'declined',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;

export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const assignmentStatus = core.cast.identity<AssignmentStatus>();
