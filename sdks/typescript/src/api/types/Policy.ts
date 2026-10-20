import * as core from '../../core';
import { PolicyProduct, policyProduct } from './PolicyProduct';
import { PolicyStatus, policyStatus } from './PolicyStatus';
import { Money, money, moneyRequest, moneyResponse } from './Money';
import { PolicyBillingFrequency, policyBillingFrequency } from './PolicyBillingFrequency';

export interface Policy {
  id: string;
  policyNumber: string;
  customerId: string;
  product: PolicyProduct;
  status: PolicyStatus;
  effectiveDate: string;
  expirationDate: string;
  premium?: Money | undefined;
  billingFrequency?: PolicyBillingFrequency | undefined;
}

export namespace Policy {
  export type Product = PolicyProduct;
  export const Product = PolicyProduct;
  export type BillingFrequency = PolicyBillingFrequency;
  export const BillingFrequency = PolicyBillingFrequency;
}

/**
 * Cast schema for the Policy model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const policy = core.cast.identity<Policy>();

/**
 * Cast schema for mapping API responses to the Policy application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const policyResponse = core.cast.object(
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
    };
  },
  ['id', 'policyNumber', 'customerId', 'product', 'status', 'effectiveDate', 'expirationDate'],
);

/**
 * Cast schema for mapping the Policy application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const policyRequest = core.cast.object(
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
    };
  },
  ['id', 'policyNumber', 'customerId', 'product', 'status', 'effectiveDate', 'expirationDate'],
);
