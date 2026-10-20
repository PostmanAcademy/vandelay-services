import * as core from '../../../../core';
import { DriverCreateRelationship, driverCreateRelationship } from './DriverCreateRelationship';
import { DriverCreate } from '../client/requests/DriverCreate';

export type { DriverCreate };

/**
 * Cast schema for the DriverCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const driverCreate = core.cast.identity<DriverCreate>();

/**
 * Cast schema for mapping API responses to the DriverCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const driverCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'firstName',
      'lastName',
      'dateOfBirth',
      'licenseNumber',
      'licenseState',
      'relationship',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      firstName: raw['firstName'],
      lastName: raw['lastName'],
      dateOfBirth: raw['dateOfBirth'],
      licenseNumber: raw['licenseNumber'],
      licenseState: raw['licenseState'],
      relationship: raw['relationship'],
    };
  },
  ['firstName', 'lastName', 'dateOfBirth', 'licenseNumber', 'licenseState', 'relationship'],
);

/**
 * Cast schema for mapping the DriverCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const driverCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      firstName: raw['firstName'],
      lastName: raw['lastName'],
      dateOfBirth: raw['dateOfBirth'],
      licenseNumber: raw['licenseNumber'],
      licenseState: raw['licenseState'],
      relationship: raw['relationship'],
    };
  },
  ['firstName', 'lastName', 'dateOfBirth', 'licenseNumber', 'licenseState', 'relationship'],
);
