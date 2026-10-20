import * as core from '../../core';

export interface InsuredVehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
}

/**
 * Cast schema for the InsuredVehicle model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const insuredVehicle = core.cast.identity<InsuredVehicle>();

/**
 * Cast schema for mapping API responses to the InsuredVehicle application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const insuredVehicleResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['id', 'vin', 'year', 'make', 'model']);
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
    };
  },
  ['id', 'vin', 'year', 'make', 'model'],
);

/**
 * Cast schema for mapping the InsuredVehicle application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const insuredVehicleRequest = core.cast.object(
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
    };
  },
  ['id', 'vin', 'year', 'make', 'model'],
);
