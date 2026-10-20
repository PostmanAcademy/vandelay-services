import * as core from '../../core';
import { AssignmentRole, assignmentRole } from './AssignmentRole';
import { AssignmentStatus, assignmentStatus } from './AssignmentStatus';

export interface Assignment {
  id: string;
  claimId: string;
  vendorId: string;
  role: AssignmentRole;
  status: AssignmentStatus;
  scheduledFor?: string | undefined;
  createdAt: string;
}

export namespace Assignment {
  export type Role = AssignmentRole;
  export const Role = AssignmentRole;
  export type Status = AssignmentStatus;
  export const Status = AssignmentStatus;
}

/**
 * Cast schema for the Assignment model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const assignment = core.cast.identity<Assignment>();

/**
 * Cast schema for mapping API responses to the Assignment application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const assignmentResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'claimId',
      'vendorId',
      'role',
      'status',
      'scheduledFor',
      'createdAt',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      id: raw['id'],
      claimId: raw['claimId'],
      vendorId: raw['vendorId'],
      role: raw['role'],
      status: raw['status'],
      scheduledFor: raw['scheduledFor'],
      createdAt: raw['createdAt'],
    };
  },
  ['id', 'claimId', 'vendorId', 'role', 'status', 'createdAt'],
);

/**
 * Cast schema for mapping the Assignment application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const assignmentRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      claimId: raw['claimId'],
      vendorId: raw['vendorId'],
      role: raw['role'],
      status: raw['status'],
      scheduledFor: raw['scheduledFor'],
      createdAt: raw['createdAt'],
    };
  },
  ['id', 'claimId', 'vendorId', 'role', 'status', 'createdAt'],
);
