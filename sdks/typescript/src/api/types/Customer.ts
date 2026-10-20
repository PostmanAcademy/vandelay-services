import * as core from '../../core';
import { Address, address, addressRequest, addressResponse } from './Address';
import { CustomerStatus, customerStatus } from './CustomerStatus';
import { Preferences, preferences, preferencesRequest, preferencesResponse } from './Preferences';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** E.164 format. */
  phone?: string | undefined;
  /** Masked (`YYYY-**-**`) without the `customers:pii:read` scope. */
  dateOfBirth?: string | undefined;
  address?: Address | undefined;
  status: CustomerStatus;
  preferences?: Preferences | undefined;
  createdAt: string;
  updatedAt: string;
}

export namespace Customer {
  export type Status = CustomerStatus;
  export const Status = CustomerStatus;
}

/**
 * Cast schema for the Customer model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const customer = core.cast.identity<Customer>();

/**
 * Cast schema for mapping API responses to the Customer application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const customerResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'address',
      'status',
      'preferences',
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
      firstName: raw['firstName'],
      lastName: raw['lastName'],
      email: raw['email'],
      phone: raw['phone'],
      dateOfBirth: raw['dateOfBirth'],
      address: raw['address'] == null ? raw['address'] : addressResponse.parse(raw['address']),
      status: raw['status'],
      preferences:
        raw['preferences'] == null
          ? raw['preferences']
          : preferencesResponse.parse(raw['preferences']),
      createdAt: raw['createdAt'],
      updatedAt: raw['updatedAt'],
    };
  },
  ['id', 'firstName', 'lastName', 'email', 'status', 'createdAt', 'updatedAt'],
);

/**
 * Cast schema for mapping the Customer application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const customerRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      firstName: raw['firstName'],
      lastName: raw['lastName'],
      email: raw['email'],
      phone: raw['phone'],
      dateOfBirth: raw['dateOfBirth'],
      address: raw['address'] == null ? raw['address'] : addressRequest.parse(raw['address']),
      status: raw['status'],
      preferences:
        raw['preferences'] == null
          ? raw['preferences']
          : preferencesRequest.parse(raw['preferences']),
      createdAt: raw['createdAt'],
      updatedAt: raw['updatedAt'],
    };
  },
  ['id', 'firstName', 'lastName', 'email', 'status', 'createdAt', 'updatedAt'],
);
