import * as core from '../../../../core';
import {
  PaymentMethod,
  paymentMethod,
  paymentMethodRequest,
  paymentMethodResponse,
} from '../../../types/PaymentMethod';

export interface ListPaymentMethodsResponse {
  data: PaymentMethod[];
}

/**
 * Cast schema for the ListPaymentMethodsResponse model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const listPaymentMethodsResponse = core.cast.identity<ListPaymentMethodsResponse>();

/**
 * Cast schema for mapping API responses to the ListPaymentMethodsResponse application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const listPaymentMethodsResponseResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['data']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : paymentMethodResponse.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);

/**
 * Cast schema for mapping the ListPaymentMethodsResponse application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const listPaymentMethodsResponseRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : paymentMethodRequest.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);
