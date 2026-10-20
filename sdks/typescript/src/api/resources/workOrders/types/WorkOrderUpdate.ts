import * as core from '../../../../core';
import { WorkOrderStatus, workOrderStatus } from '../../../types/WorkOrderStatus';
import { Money, money, moneyRequest, moneyResponse } from '../../../types/Money';
import { WorkOrderUpdate } from '../client/requests/WorkOrderUpdate';

export type { WorkOrderUpdate };

/**
 * Cast schema for the WorkOrderUpdate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const workOrderUpdate = core.cast.identity<WorkOrderUpdate>();

/**
 * Cast schema for mapping API responses to the WorkOrderUpdate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const workOrderUpdateResponse = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  const __declaredKeys = new Set<string>(['status', 'estimate', 'scheduledFor', 'notes']);
  const __extras: { [key: string]: unknown } = {};
  for (const __key of globalThis.Object.keys(raw as object)) {
    if (!__declaredKeys.has(__key)) {
      __extras[__key] = (raw as { [key: string]: unknown })[__key];
    }
  }
  return {
    ...__extras,
    status: raw['status'],
    estimate: raw['estimate'] == null ? raw['estimate'] : moneyResponse.parse(raw['estimate']),
    scheduledFor: raw['scheduledFor'],
    notes: raw['notes'],
  };
}, []);

/**
 * Cast schema for mapping the WorkOrderUpdate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const workOrderUpdateRequest = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  return {
    status: raw['status'],
    estimate: raw['estimate'] == null ? raw['estimate'] : moneyRequest.parse(raw['estimate']),
    scheduledFor: raw['scheduledFor'],
    notes: raw['notes'],
  };
}, []);
