import * as core from '../../core';
import { VendorType, vendorType } from './VendorType';
import { WorkOrderStatus, workOrderStatus } from './WorkOrderStatus';
import { Money, money, moneyRequest, moneyResponse } from './Money';

export interface WorkOrder {
  id: string;
  claimId: string;
  vendorId: string;
  type: VendorType;
  status: WorkOrderStatus;
  estimate?: Money | undefined;
  scheduledFor?: string | undefined;
  instructions?: string | undefined;
  notes?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cast schema for the WorkOrder model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const workOrder = core.cast.identity<WorkOrder>();

/**
 * Cast schema for mapping API responses to the WorkOrder application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const workOrderResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'claimId',
      'vendorId',
      'type',
      'status',
      'estimate',
      'scheduledFor',
      'instructions',
      'notes',
      'createdAt',
      'updatedAt',
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
      type: raw['type'],
      status: raw['status'],
      estimate: raw['estimate'] == null ? raw['estimate'] : moneyResponse.parse(raw['estimate']),
      scheduledFor: raw['scheduledFor'],
      instructions: raw['instructions'],
      notes: raw['notes'],
      createdAt: raw['createdAt'],
      updatedAt: raw['updatedAt'],
    };
  },
  ['id', 'claimId', 'vendorId', 'type', 'status', 'createdAt', 'updatedAt'],
);

/**
 * Cast schema for mapping the WorkOrder application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const workOrderRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      claimId: raw['claimId'],
      vendorId: raw['vendorId'],
      type: raw['type'],
      status: raw['status'],
      estimate: raw['estimate'] == null ? raw['estimate'] : moneyRequest.parse(raw['estimate']),
      scheduledFor: raw['scheduledFor'],
      instructions: raw['instructions'],
      notes: raw['notes'],
      createdAt: raw['createdAt'],
      updatedAt: raw['updatedAt'],
    };
  },
  ['id', 'claimId', 'vendorId', 'type', 'status', 'createdAt', 'updatedAt'],
);
