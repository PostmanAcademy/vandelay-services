import * as core from '../../../../core';
import {
  CoverageVerificationRequestClaimType,
  coverageVerificationRequestClaimType,
} from './CoverageVerificationRequestClaimType';
import { CoverageVerificationRequest } from '../client/requests/CoverageVerificationRequest';

export type { CoverageVerificationRequest };

/**
 * Cast schema for the CoverageVerificationRequest model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const coverageVerificationRequest_3 = core.cast.identity<CoverageVerificationRequest>();

/**
 * Cast schema for mapping API responses to the CoverageVerificationRequest application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const coverageVerificationRequestResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['lossDate', 'claimType', 'vehicleId', 'driverId']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      lossDate: raw['lossDate'],
      claimType: raw['claimType'],
      vehicleId: raw['vehicleId'],
      driverId: raw['driverId'],
    };
  },
  ['lossDate', 'claimType'],
);

/**
 * Cast schema for mapping the CoverageVerificationRequest application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const coverageVerificationRequestRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      lossDate: raw['lossDate'],
      claimType: raw['claimType'],
      vehicleId: raw['vehicleId'],
      driverId: raw['driverId'],
    };
  },
  ['lossDate', 'claimType'],
);
