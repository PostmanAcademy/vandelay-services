export interface ListCustomersRequest {
  email?: string;
  phone?: string;
  lastName?: string;
  limit?: number;
  cursor?: string;
}
