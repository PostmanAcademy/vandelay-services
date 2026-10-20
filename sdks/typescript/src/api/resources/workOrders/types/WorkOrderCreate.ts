import * as core from '../../../../core';
import { VendorType, vendorType } from '../../../types/VendorType';
import { WorkOrderCreate } from '../client/requests/WorkOrderCreate';

export type { WorkOrderCreate };

/**
 * Cast schema for the WorkOrderCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const workOrderCreate = core.cast.identity<WorkOrderCreate>();

/**
 * Cast schema for mapping API responses to the WorkOrderCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const workOrderCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'claimId',
      'vendorId',
      'type',
      'scheduledFor',
      'instructions',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      claimId: raw['claimId'],
      vendorId: raw['vendorId'],
      type: raw['type'],
      scheduledFor: raw['scheduledFor'],
      instructions: raw['instructions'],
    };
  },
  ['claimId', 'vendorId', 'type'],
);

/**
 * Cast schema for mapping the WorkOrderCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const workOrderCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      claimId: raw['claimId'],
      vendorId: raw['vendorId'],
      type: raw['type'],
      scheduledFor: raw['scheduledFor'],
      instructions: raw['instructions'],
    };
  },
  ['claimId', 'vendorId', 'type'],
);
