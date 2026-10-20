import * as core from '../../core';
import { PaymentMethodType, paymentMethodType } from './PaymentMethodType';

export interface PaymentMethod {
  id: string;
  payeeId: string;
  type: PaymentMethodType;
  label?: string | undefined;
  last4: string;
  bankName?: string | undefined;
  isDefault?: boolean | undefined;
}

export namespace PaymentMethod {
  export type Type = PaymentMethodType;
  export const Type = PaymentMethodType;
}

/**
 * Cast schema for the PaymentMethod model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const paymentMethod = core.cast.identity<PaymentMethod>();

/**
 * Cast schema for mapping API responses to the PaymentMethod application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const paymentMethodResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'payeeId',
      'type',
      'label',
      'last4',
      'bankName',
      'isDefault',
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
      payeeId: raw['payeeId'],
      type: raw['type'],
      label: raw['label'],
      last4: raw['last4'],
      bankName: raw['bankName'],
      isDefault: raw['isDefault'],
    };
  },
  ['id', 'payeeId', 'type', 'last4'],
);

/**
 * Cast schema for mapping the PaymentMethod application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const paymentMethodRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      payeeId: raw['payeeId'],
      type: raw['type'],
      label: raw['label'],
      last4: raw['last4'],
      bankName: raw['bankName'],
      isDefault: raw['isDefault'],
    };
  },
  ['id', 'payeeId', 'type', 'last4'],
);
