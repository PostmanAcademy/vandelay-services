import * as core from '../../../../core';
import { Vehicle, vehicle, vehicleRequest, vehicleResponse } from '../../../types/Vehicle';

export interface ListCustomerVehiclesResponse {
  data: Vehicle[];
}

/**
 * Cast schema for the ListCustomerVehiclesResponse model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const listCustomerVehiclesResponse = core.cast.identity<ListCustomerVehiclesResponse>();

/**
 * Cast schema for mapping API responses to the ListCustomerVehiclesResponse application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const listCustomerVehiclesResponseResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['data']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : vehicleResponse.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);

/**
 * Cast schema for mapping the ListCustomerVehiclesResponse application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const listCustomerVehiclesResponseRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : vehicleRequest.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);
