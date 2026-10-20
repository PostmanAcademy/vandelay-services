import * as core from '../../../../core';
import { PaymentMethodCreateType, paymentMethodCreateType } from './PaymentMethodCreateType';

export interface PaymentMethodCreate {
  payeeId: string;
  type: PaymentMethodCreateType;
  /** Single-use token from the hosted payment form. */
  token: string;
  isDefault?: boolean | undefined;
}

export namespace PaymentMethodCreate {
  export type Type = PaymentMethodCreateType;
  export const Type = PaymentMethodCreateType;
}

/**
 * Cast schema for the PaymentMethodCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const paymentMethodCreate = core.cast.identity<PaymentMethodCreate>();

/**
 * Cast schema for mapping API responses to the PaymentMethodCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const paymentMethodCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['payeeId', 'type', 'token', 'isDefault']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      payeeId: raw['payeeId'],
      type: raw['type'],
      token: raw['token'],
      isDefault: raw['isDefault'],
    };
  },
  ['payeeId', 'type', 'token'],
);

/**
 * Cast schema for mapping the PaymentMethodCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const paymentMethodCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      payeeId: raw['payeeId'],
      type: raw['type'],
      token: raw['token'],
      isDefault: raw['isDefault'],
    };
  },
  ['payeeId', 'type', 'token'],
);
