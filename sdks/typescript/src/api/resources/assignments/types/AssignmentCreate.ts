import * as core from '../../../../core';
import { AssignmentCreateRole, assignmentCreateRole } from './AssignmentCreateRole';
import { AssignmentCreate } from '../client/requests/AssignmentCreate';

export type { AssignmentCreate };

/**
 * Cast schema for the AssignmentCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const assignmentCreate = core.cast.identity<AssignmentCreate>();

/**
 * Cast schema for mapping API responses to the AssignmentCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const assignmentCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['vendorId', 'role', 'scheduledFor', 'instructions']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      vendorId: raw['vendorId'],
      role: raw['role'],
      scheduledFor: raw['scheduledFor'],
      instructions: raw['instructions'],
    };
  },
  ['vendorId', 'role'],
);

/**
 * Cast schema for mapping the AssignmentCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const assignmentCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      vendorId: raw['vendorId'],
      role: raw['role'],
      scheduledFor: raw['scheduledFor'],
      instructions: raw['instructions'],
    };
  },
  ['vendorId', 'role'],
);
