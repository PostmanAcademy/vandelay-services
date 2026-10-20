import * as core from '../../core';
import { ClaimStatus, claimStatus } from './ClaimStatus';
import { ClaimType, claimType } from './ClaimType';
import { Address, address, addressRequest, addressResponse } from './Address';
import { Money, money, moneyRequest, moneyResponse } from './Money';

export interface Claim {
  id: string;
  customerId: string;
  policyId: string;
  vehicleId?: string | undefined;
  status: ClaimStatus;
  type: ClaimType;
  lossDate: string;
  lossLocation?: Address | undefined;
  description?: string | undefined;
  drivable?: boolean | undefined;
  injuries?: boolean | undefined;
  policeReportNumber?: string | null | undefined;
  estimatedAmount?: Money | null | undefined;
  deductible?: Money | undefined;
  assignedAdjusterId?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cast schema for the Claim model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const claim = core.cast.identity<Claim>();

/**
 * Cast schema for mapping API responses to the Claim application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const claimResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'customerId',
      'policyId',
      'vehicleId',
      'status',
      'type',
      'lossDate',
      'lossLocation',
      'description',
      'drivable',
      'injuries',
      'policeReportNumber',
      'estimatedAmount',
      'deductible',
      'assignedAdjusterId',
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
      customerId: raw['customerId'],
      policyId: raw['policyId'],
      vehicleId: raw['vehicleId'],
      status: raw['status'],
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
      estimatedAmount:
        raw['estimatedAmount'] == null
          ? raw['estimatedAmount']
          : moneyResponse.parse(raw['estimatedAmount']),
      deductible:
        raw['deductible'] == null ? raw['deductible'] : moneyResponse.parse(raw['deductible']),
      assignedAdjusterId: raw['assignedAdjusterId'],
      createdAt: raw['createdAt'],
      updatedAt: raw['updatedAt'],
    };
  },
  ['id', 'customerId', 'policyId', 'status', 'type', 'lossDate', 'createdAt', 'updatedAt'],
);

/**
 * Cast schema for mapping the Claim application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const claimRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      customerId: raw['customerId'],
      policyId: raw['policyId'],
      vehicleId: raw['vehicleId'],
      status: raw['status'],
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
      estimatedAmount:
        raw['estimatedAmount'] == null
          ? raw['estimatedAmount']
          : moneyRequest.parse(raw['estimatedAmount']),
      deductible:
        raw['deductible'] == null ? raw['deductible'] : moneyRequest.parse(raw['deductible']),
      assignedAdjusterId: raw['assignedAdjusterId'],
      createdAt: raw['createdAt'],
      updatedAt: raw['updatedAt'],
    };
  },
  ['id', 'customerId', 'policyId', 'status', 'type', 'lossDate', 'createdAt', 'updatedAt'],
);
