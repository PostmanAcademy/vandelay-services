import * as core from '../../../../core';
import { VendorType, vendorType } from '../../../types/VendorType';
import { Address, address, addressRequest, addressResponse } from '../../../types/Address';
import { VendorCreate } from '../client/requests/VendorCreate';

export type { VendorCreate };

/**
 * Cast schema for the VendorCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const vendorCreate = core.cast.identity<VendorCreate>();

/**
 * Cast schema for mapping API responses to the VendorCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const vendorCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'name',
      'type',
      'taxId',
      'phone',
      'email',
      'address',
      'serviceAreaPostalCodes',
      'inNetwork',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      name: raw['name'],
      type: raw['type'],
      taxId: raw['taxId'],
      phone: raw['phone'],
      email: raw['email'],
      address: raw['address'] == null ? raw['address'] : addressResponse.parse(raw['address']),
      serviceAreaPostalCodes: raw['serviceAreaPostalCodes'],
      inNetwork: raw['inNetwork'],
    };
  },
  ['name', 'type', 'phone', 'email', 'address'],
);

/**
 * Cast schema for mapping the VendorCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const vendorCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      name: raw['name'],
      type: raw['type'],
      taxId: raw['taxId'],
      phone: raw['phone'],
      email: raw['email'],
      address: raw['address'] == null ? raw['address'] : addressRequest.parse(raw['address']),
      serviceAreaPostalCodes: raw['serviceAreaPostalCodes'],
      inNetwork: raw['inNetwork'],
    };
  },
  ['name', 'type', 'phone', 'email', 'address'],
);
