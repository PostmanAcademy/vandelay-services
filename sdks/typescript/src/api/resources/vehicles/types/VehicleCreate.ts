import * as core from '../../../../core';
import { VehicleCreate } from '../client/requests/VehicleCreate';

export type { VehicleCreate };

/**
 * Cast schema for the VehicleCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const vehicleCreate = core.cast.identity<VehicleCreate>();

/**
 * Cast schema for mapping API responses to the VehicleCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const vehicleCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'vin',
      'year',
      'make',
      'model',
      'trim',
      'color',
      'licensePlate',
      'licensePlateState',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      vin: raw['vin'],
      year: raw['year'],
      make: raw['make'],
      model: raw['model'],
      trim: raw['trim'],
      color: raw['color'],
      licensePlate: raw['licensePlate'],
      licensePlateState: raw['licensePlateState'],
    };
  },
  ['vin', 'year', 'make', 'model'],
);

/**
 * Cast schema for mapping the VehicleCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const vehicleCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      vin: raw['vin'],
      year: raw['year'],
      make: raw['make'],
      model: raw['model'],
      trim: raw['trim'],
      color: raw['color'],
      licensePlate: raw['licensePlate'],
      licensePlateState: raw['licensePlateState'],
    };
  },
  ['vin', 'year', 'make', 'model'],
);
