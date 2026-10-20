import { VendorUpdateStatus, vendorUpdateStatus } from '../../types/VendorUpdateStatus';

export interface VendorUpdate {
  vendorId: string;
  name?: string;
  phone?: string;
  email?: string;
  inNetwork?: boolean;
  status?: VendorUpdateStatus;
}

export namespace VendorUpdate {
  export type Status = VendorUpdateStatus;
  export const Status = VendorUpdateStatus;
}
