import * as core from '../../core';
import { DriverRelationship, driverRelationship } from './DriverRelationship';

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  licenseState?: string | undefined;
  relationship: DriverRelationship;
}

export namespace Driver {
  export type Relationship = DriverRelationship;
  export const Relationship = DriverRelationship;
}

/**
 * Cast schema for the Driver model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const driver = core.cast.identity<Driver>();

/**
 * Cast schema for mapping API responses to the Driver application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const driverResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'firstName',
      'lastName',
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
      id: raw['id'],
      firstName: raw['firstName'],
      lastName: raw['lastName'],
      licenseState: raw['licenseState'],
      relationship: raw['relationship'],
    };
  },
  ['id', 'firstName', 'lastName', 'relationship'],
);

/**
 * Cast schema for mapping the Driver application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const driverRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      firstName: raw['firstName'],
      lastName: raw['lastName'],
      licenseState: raw['licenseState'],
      relationship: raw['relationship'],
    };
  },
  ['id', 'firstName', 'lastName', 'relationship'],
);
