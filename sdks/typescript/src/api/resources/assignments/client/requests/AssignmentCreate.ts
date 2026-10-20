import { AssignmentCreateRole, assignmentCreateRole } from '../../types/AssignmentCreateRole';

export interface AssignmentCreate {
  claimId: string;
  vendorId: string;
  role: AssignmentCreateRole;
  scheduledFor?: string;
  instructions?: string;
}

export namespace AssignmentCreate {
  export type Role = AssignmentCreateRole;
  export const Role = AssignmentCreateRole;
}
