export interface VehicleCreate {
  customerId: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color?: string;
  licensePlate?: string;
  licensePlateState?: string;
}
