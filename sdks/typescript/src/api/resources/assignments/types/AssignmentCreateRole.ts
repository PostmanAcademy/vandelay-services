import * as core from '../../../../core';

export const AssignmentCreateRole = {
  Tow: 'tow',
  Repair: 'repair',
  Rental: 'rental',
  Appraisal: 'appraisal',
  Glass: 'glass',
} as const;

export type AssignmentCreateRole = (typeof AssignmentCreateRole)[keyof typeof AssignmentCreateRole];

export const assignmentCreateRole = core.cast.identity<AssignmentCreateRole>();
