import * as core from '../../core';
import { VendorType, vendorType } from './VendorType';
import { Address, address, addressRequest, addressResponse } from './Address';
import { VendorStatus, vendorStatus } from './VendorStatus';

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  inNetwork?: boolean | undefined;
  rating?: number | undefined;
  /** Present when searching by `postalCode`. */
  distanceMiles?: number | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  address?: Address | undefined;
  serviceAreaPostalCodes?: string[] | undefined;
  status: VendorStatus;
  createdAt?: string | undefined;
}

export namespace Vendor {
  export type Status = VendorStatus;
  export const Status = VendorStatus;
}

/**
 * Cast schema for the Vendor model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const vendor = core.cast.identity<Vendor>();

/**
 * Cast schema for mapping API responses to the Vendor application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const vendorResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'name',
      'type',
      'inNetwork',
      'rating',
      'distanceMiles',
      'phone',
      'email',
      'address',
      'serviceAreaPostalCodes',
      'status',
      'createdAt',
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
      name: raw['name'],
      type: raw['type'],
      inNetwork: raw['inNetwork'],
      rating: raw['rating'],
      distanceMiles: raw['distanceMiles'],
      phone: raw['phone'],
      email: raw['email'],
      address: raw['address'] == null ? raw['address'] : addressResponse.parse(raw['address']),
      serviceAreaPostalCodes: raw['serviceAreaPostalCodes'],
      status: raw['status'],
      createdAt: raw['createdAt'],
    };
  },
  ['id', 'name', 'type', 'status'],
);

/**
 * Cast schema for mapping the Vendor application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const vendorRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      name: raw['name'],
      type: raw['type'],
      inNetwork: raw['inNetwork'],
      rating: raw['rating'],
      distanceMiles: raw['distanceMiles'],
      phone: raw['phone'],
      email: raw['email'],
      address: raw['address'] == null ? raw['address'] : addressRequest.parse(raw['address']),
      serviceAreaPostalCodes: raw['serviceAreaPostalCodes'],
      status: raw['status'],
      createdAt: raw['createdAt'],
    };
  },
  ['id', 'name', 'type', 'status'],
);
