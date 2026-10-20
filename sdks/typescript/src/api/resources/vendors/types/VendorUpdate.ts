import * as core from '../../../../core';
import { VendorUpdateStatus, vendorUpdateStatus } from './VendorUpdateStatus';
import { VendorUpdate } from '../client/requests/VendorUpdate';

export type { VendorUpdate };

/**
 * Cast schema for the VendorUpdate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const vendorUpdate = core.cast.identity<VendorUpdate>();

/**
 * Cast schema for mapping API responses to the VendorUpdate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const vendorUpdateResponse = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  const __declaredKeys = new Set<string>(['name', 'phone', 'email', 'inNetwork', 'status']);
  const __extras: { [key: string]: unknown } = {};
  for (const __key of globalThis.Object.keys(raw as object)) {
    if (!__declaredKeys.has(__key)) {
      __extras[__key] = (raw as { [key: string]: unknown })[__key];
    }
  }
  return {
    ...__extras,
    name: raw['name'],
    phone: raw['phone'],
    email: raw['email'],
    inNetwork: raw['inNetwork'],
    status: raw['status'],
  };
}, []);

/**
 * Cast schema for mapping the VendorUpdate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const vendorUpdateRequest = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  return {
    name: raw['name'],
    phone: raw['phone'],
    email: raw['email'],
    inNetwork: raw['inNetwork'],
    status: raw['status'],
  };
}, []);
