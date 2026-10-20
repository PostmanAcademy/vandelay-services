import * as core from '../../core';

export interface Vehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string | undefined;
  color?: string | undefined;
  licensePlate?: string | undefined;
  licensePlateState?: string | undefined;
}

/**
 * Cast schema for the Vehicle model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const vehicle = core.cast.identity<Vehicle>();

/**
 * Cast schema for mapping API responses to the Vehicle application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const vehicleResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
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
      id: raw['id'],
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
  ['id', 'vin', 'year', 'make', 'model'],
);

/**
 * Cast schema for mapping the Vehicle application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const vehicleRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
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
  ['id', 'vin', 'year', 'make', 'model'],
);
