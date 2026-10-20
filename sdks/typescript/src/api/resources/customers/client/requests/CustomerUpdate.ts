import { Address, address } from '../../../../types/Address';

export interface CustomerUpdate {
  customerId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: Address;
}
