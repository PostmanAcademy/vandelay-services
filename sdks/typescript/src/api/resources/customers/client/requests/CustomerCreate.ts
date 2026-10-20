import { Address, address } from '../../../../types/Address';
import { Preferences, preferences } from '../../../../types/Preferences';

export interface CustomerCreate {
  'Idempotency-Key'?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: Address;
  preferences?: Preferences;
}
