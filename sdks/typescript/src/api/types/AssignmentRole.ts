import * as core from '../../core';

export const AssignmentRole = {
  Tow: 'tow',
  Repair: 'repair',
  Rental: 'rental',
  Appraisal: 'appraisal',
  Glass: 'glass',
} as const;

export type AssignmentRole = (typeof AssignmentRole)[keyof typeof AssignmentRole];

export const assignmentRole = core.cast.identity<AssignmentRole>();
