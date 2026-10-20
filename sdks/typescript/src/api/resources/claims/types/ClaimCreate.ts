import * as core from '../../../../core';
import { ClaimType, claimType } from '../../../types/ClaimType';
import { Address, address, addressRequest, addressResponse } from '../../../types/Address';
import { ClaimCreate } from '../client/requests/ClaimCreate';

export type { ClaimCreate };

/**
 * Cast schema for the ClaimCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const claimCreate = core.cast.identity<ClaimCreate>();

/**
 * Cast schema for mapping API responses to the ClaimCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const claimCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'customerId',
      'policyId',
      'vehicleId',
      'type',
      'lossDate',
      'lossLocation',
      'description',
      'drivable',
      'injuries',
      'policeReportNumber',
      'submit',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      customerId: raw['customerId'],
      policyId: raw['policyId'],
      vehicleId: raw['vehicleId'],
      type: raw['type'],
      lossDate: raw['lossDate'],
      lossLocation:
        raw['lossLocation'] == null
          ? raw['lossLocation']
          : addressResponse.parse(raw['lossLocation']),
      description: raw['description'],
      drivable: raw['drivable'],
      injuries: raw['injuries'],
      policeReportNumber: raw['policeReportNumber'],
      submit: raw['submit'],
    };
  },
  ['customerId', 'policyId', 'type', 'lossDate', 'description'],
);

/**
 * Cast schema for mapping the ClaimCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const claimCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      customerId: raw['customerId'],
      policyId: raw['policyId'],
      vehicleId: raw['vehicleId'],
      type: raw['type'],
      lossDate: raw['lossDate'],
      lossLocation:
        raw['lossLocation'] == null
          ? raw['lossLocation']
          : addressRequest.parse(raw['lossLocation']),
      description: raw['description'],
      drivable: raw['drivable'],
      injuries: raw['injuries'],
      policeReportNumber: raw['policeReportNumber'],
      submit: raw['submit'],
    };
  },
  ['customerId', 'policyId', 'type', 'lossDate', 'description'],
);
