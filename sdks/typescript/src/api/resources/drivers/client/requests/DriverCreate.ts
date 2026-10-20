import {
  DriverCreateRelationship,
  driverCreateRelationship,
} from '../../types/DriverCreateRelationship';

export interface DriverCreate {
  policyId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseNumber: string;
  licenseState: string;
  relationship: DriverCreateRelationship;
}

export namespace DriverCreate {
  export type Relationship = DriverCreateRelationship;
  export const Relationship = DriverCreateRelationship;
}
