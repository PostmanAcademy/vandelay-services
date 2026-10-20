import * as core from '../../../../core';
import { Address, address, addressRequest, addressResponse } from '../../../types/Address';
import { CustomerUpdate } from '../client/requests/CustomerUpdate';

export type { CustomerUpdate };

/**
 * Cast schema for the CustomerUpdate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const customerUpdate = core.cast.identity<CustomerUpdate>();

/**
 * Cast schema for mapping API responses to the CustomerUpdate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const customerUpdateResponse = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  const __declaredKeys = new Set<string>(['firstName', 'lastName', 'email', 'phone', 'address']);
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
    address: raw['address'] == null ? raw['address'] : addressResponse.parse(raw['address']),
  };
}, []);

/**
 * Cast schema for mapping the CustomerUpdate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const customerUpdateRequest = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  return {
    firstName: raw['firstName'],
    lastName: raw['lastName'],
    email: raw['email'],
    phone: raw['phone'],
    address: raw['address'] == null ? raw['address'] : addressRequest.parse(raw['address']),
  };
}, []);
