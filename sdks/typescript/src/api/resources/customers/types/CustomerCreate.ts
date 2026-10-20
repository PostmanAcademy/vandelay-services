import * as core from '../../../../core';
import { Address, address, addressRequest, addressResponse } from '../../../types/Address';
import {
  Preferences,
  preferences,
  preferencesRequest,
  preferencesResponse,
} from '../../../types/Preferences';
import { CustomerCreate } from '../client/requests/CustomerCreate';

export type { CustomerCreate };

/**
 * Cast schema for the CustomerCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const customerCreate = core.cast.identity<CustomerCreate>();

/**
 * Cast schema for mapping API responses to the CustomerCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const customerCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'address',
      'preferences',
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
      email: raw['email'],
      phone: raw['phone'],
      dateOfBirth: raw['dateOfBirth'],
      address: raw['address'] == null ? raw['address'] : addressResponse.parse(raw['address']),
      preferences:
        raw['preferences'] == null
          ? raw['preferences']
          : preferencesResponse.parse(raw['preferences']),
    };
  },
  ['firstName', 'lastName', 'email'],
);

/**
 * Cast schema for mapping the CustomerCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const customerCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      firstName: raw['firstName'],
      lastName: raw['lastName'],
      email: raw['email'],
      phone: raw['phone'],
      dateOfBirth: raw['dateOfBirth'],
      address: raw['address'] == null ? raw['address'] : addressRequest.parse(raw['address']),
      preferences:
        raw['preferences'] == null
          ? raw['preferences']
          : preferencesRequest.parse(raw['preferences']),
    };
  },
  ['firstName', 'lastName', 'email'],
);
