import * as core from '../../core';
import { PolicyDetailProduct, policyDetailProduct } from './PolicyDetailProduct';
import { PolicyStatus, policyStatus } from './PolicyStatus';
import { Money, money, moneyRequest, moneyResponse } from './Money';
import {
  PolicyDetailBillingFrequency,
  policyDetailBillingFrequency,
} from './PolicyDetailBillingFrequency';
import { Coverage, coverage, coverageRequest, coverageResponse } from './Coverage';
import {
  InsuredVehicle,
  insuredVehicle,
  insuredVehicleRequest,
  insuredVehicleResponse,
} from './InsuredVehicle';
import { Driver, driver, driverRequest, driverResponse } from './Driver';
import { Policy, policy, policyRequest, policyResponse } from './Policy';

export interface PolicyDetail extends Policy {
  product: PolicyDetailProduct;
  billingFrequency?: PolicyDetailBillingFrequency | undefined;
  coverages?: Coverage[] | undefined;
  vehicles?: InsuredVehicle[] | undefined;
  drivers?: Driver[] | undefined;
}

export namespace PolicyDetail {
  export type Product = PolicyDetailProduct;
  export const Product = PolicyDetailProduct;
  export type BillingFrequency = PolicyDetailBillingFrequency;
  export const BillingFrequency = PolicyDetailBillingFrequency;
}

/**
 * Cast schema for the PolicyDetail model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const policyDetail = core.cast.identity<PolicyDetail>();

/**
 * Cast schema for mapping API responses to the PolicyDetail application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const policyDetailResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'policyNumber',
      'customerId',
      'product',
      'status',
      'effectiveDate',
      'expirationDate',
      'premium',
      'billingFrequency',
      'coverages',
      'vehicles',
      'drivers',
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
      policyNumber: raw['policyNumber'],
      customerId: raw['customerId'],
      product: raw['product'],
      status: raw['status'],
      effectiveDate: raw['effectiveDate'],
      expirationDate: raw['expirationDate'],
      premium: raw['premium'] == null ? raw['premium'] : moneyResponse.parse(raw['premium']),
      billingFrequency: raw['billingFrequency'],
      coverages: Array.isArray(raw['coverages'])
        ? (raw['coverages'] as any[]).map((v: any) => (v == null ? v : coverageResponse.parse(v)))
        : (raw['coverages'] as any),
      vehicles: Array.isArray(raw['vehicles'])
        ? (raw['vehicles'] as any[]).map((v: any) =>
            v == null ? v : insuredVehicleResponse.parse(v),
          )
        : (raw['vehicles'] as any),
      drivers: Array.isArray(raw['drivers'])
        ? (raw['drivers'] as any[]).map((v: any) => (v == null ? v : driverResponse.parse(v)))
        : (raw['drivers'] as any),
    };
  },
  ['id', 'policyNumber', 'customerId', 'product', 'status', 'effectiveDate', 'expirationDate'],
);

/**
 * Cast schema for mapping the PolicyDetail application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const policyDetailRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      policyNumber: raw['policyNumber'],
      customerId: raw['customerId'],
      product: raw['product'],
      status: raw['status'],
      effectiveDate: raw['effectiveDate'],
      expirationDate: raw['expirationDate'],
      premium: raw['premium'] == null ? raw['premium'] : moneyRequest.parse(raw['premium']),
      billingFrequency: raw['billingFrequency'],
      coverages: Array.isArray(raw['coverages'])
        ? (raw['coverages'] as any[]).map((v: any) => (v == null ? v : coverageRequest.parse(v)))
        : (raw['coverages'] as any),
      vehicles: Array.isArray(raw['vehicles'])
        ? (raw['vehicles'] as any[]).map((v: any) =>
            v == null ? v : insuredVehicleRequest.parse(v),
          )
        : (raw['vehicles'] as any),
      drivers: Array.isArray(raw['drivers'])
        ? (raw['drivers'] as any[]).map((v: any) => (v == null ? v : driverRequest.parse(v)))
        : (raw['drivers'] as any),
    };
  },
  ['id', 'policyNumber', 'customerId', 'product', 'status', 'effectiveDate', 'expirationDate'],
);
