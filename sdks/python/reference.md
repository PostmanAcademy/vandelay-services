# Reference

## CustomersClient

### `client.customers.list_customers`

`GET /customers/v1/customers`

Search customers

**Parameters:**

- `email`
- `phone`
- `last_name`
- `limit`
- `cursor`

### `client.customers.create_customer`

`POST /customers/v1/customers`

Create a customer

**Parameters:**

- `idempotency_key`

### `client.customers.get_customer`

`GET /customers/v1/customers/{customerId}`

Get a customer

**Parameters:**

- `customer_id` (required)

### `client.customers.update_customer`

`PATCH /customers/v1/customers/{customerId}`

Update a customer

**Parameters:**

- `customer_id` (required)

### `client.customers.delete_customer`

`DELETE /customers/v1/customers/{customerId}`

Delete (deactivate) a customer

**Parameters:**

- `customer_id` (required)

## VehiclesClient

### `client.vehicles.list_customer_vehicles`

`GET /customers/v1/customers/{customerId}/vehicles`

List a customer's vehicles

**Parameters:**

- `customer_id` (required)

### `client.vehicles.add_customer_vehicle`

`POST /customers/v1/customers/{customerId}/vehicles`

Add a vehicle

**Parameters:**

- `customer_id` (required)

### `client.vehicles.list_policy_vehicles`

`GET /policies/v1/policies/{policyId}/vehicles`

List insured vehicles

**Parameters:**

- `policy_id` (required)

## PreferencesClient

### `client.preferences.get_customer_preferences`

`GET /customers/v1/customers/{customerId}/preferences`

Get communication preferences

**Parameters:**

- `customer_id` (required)

### `client.preferences.replace_customer_preferences`

`PUT /customers/v1/customers/{customerId}/preferences`

Replace communication preferences

**Parameters:**

- `customer_id` (required)

## PoliciesClient

### `client.policies.list_policies`

`GET /policies/v1/policies`

List policies

**Parameters:**

- `customer_id`
- `status`
- `vin`
- `limit`
- `cursor`

### `client.policies.get_policy`

`GET /policies/v1/policies/{policyId}`

Get a policy

**Parameters:**

- `policy_id` (required)

## CoveragesClient

### `client.coverages.list_policy_coverages`

`GET /policies/v1/policies/{policyId}/coverages`

List policy coverages

**Parameters:**

- `policy_id` (required)

## DriversClient

### `client.drivers.list_policy_drivers`

`GET /policies/v1/policies/{policyId}/drivers`

List listed drivers

**Parameters:**

- `policy_id` (required)

### `client.drivers.add_policy_driver`

`POST /policies/v1/policies/{policyId}/drivers`

Add a driver

**Parameters:**

- `policy_id` (required)

## CoverageVerificationClient

### `client.coverage_verification.verify_coverage`

`POST /policies/v1/policies/{policyId}/coverage-verifications`

Verify coverage for a loss

**Parameters:**

- `policy_id` (required)

## ClaimsClient

### `client.claims.list_claims`

`GET /claims/v1/claims`

List claims

**Parameters:**

- `status`
- `customer_id`
- `policy_id`
- `limit`
- `cursor`

### `client.claims.create_claim`

`POST /claims/v1/claims`

Create a claim

**Parameters:**

- `idempotency_key`

### `client.claims.get_claim`

`GET /claims/v1/claims/{claimId}`

Get a claim

**Parameters:**

- `claim_id` (required)

### `client.claims.update_claim`

`PATCH /claims/v1/claims/{claimId}`

Update a claim

**Parameters:**

- `claim_id` (required)

### `client.claims.cancel_claim`

`POST /claims/v1/claims/{claimId}/cancel`

Cancel a claim

**Parameters:**

- `claim_id` (required)

## NotesClient

### `client.notes.list_claim_notes`

`GET /claims/v1/claims/{claimId}/notes`

List claim notes

**Parameters:**

- `claim_id` (required)

### `client.notes.add_claim_note`

`POST /claims/v1/claims/{claimId}/notes`

Add a note to a claim

**Parameters:**

- `claim_id` (required)

## AssignmentsClient

### `client.assignments.list_claim_assignments`

`GET /claims/v1/claims/{claimId}/assignments`

List vendor assignments

**Parameters:**

- `claim_id` (required)

### `client.assignments.assign_vendor_to_claim`

`POST /claims/v1/claims/{claimId}/assignments`

Assign a vendor to a claim

**Parameters:**

- `claim_id` (required)

## TimelineClient

### `client.timeline.get_claim_timeline`

`GET /claims/v1/claims/{claimId}/timeline`

Get claim timeline

**Parameters:**

- `claim_id` (required)

## PaymentsClient

### `client.payments.list_payments`

`GET /payments/v1/payments`

List payments

**Parameters:**

- `claim_id`
- `payee_id`
- `status`
- `limit`
- `cursor`

### `client.payments.create_payment`

`POST /payments/v1/payments`

Create a payment

**Parameters:**

- `idempotency_key` (required)

### `client.payments.get_payment`

`GET /payments/v1/payments/{paymentId}`

Get a payment

**Parameters:**

- `payment_id` (required)

### `client.payments.approve_payment`

`POST /payments/v1/payments/{paymentId}/approve`

Approve a pending payment

**Parameters:**

- `payment_id` (required)

### `client.payments.cancel_payment`

`POST /payments/v1/payments/{paymentId}/cancel`

Cancel a payment

**Parameters:**

- `payment_id` (required)

## RefundsClient

### `client.refunds.list_payment_refunds`

`GET /payments/v1/payments/{paymentId}/refunds`

List refunds for a payment

**Parameters:**

- `payment_id` (required)

### `client.refunds.create_payment_refund`

`POST /payments/v1/payments/{paymentId}/refunds`

Refund a payment

**Parameters:**

- `payment_id` (required)
- `idempotency_key` (required)

## PaymentMethodsClient

### `client.payment_methods.list_payment_methods`

`GET /payments/v1/payment-methods`

List payment methods

**Parameters:**

- `payee_id` (required)

### `client.payment_methods.create_payment_method`

`POST /payments/v1/payment-methods`

Add a payment method

## VendorsClient

### `client.vendors.list_vendors`

`GET /vendors/v1/vendors`

Search vendors

**Parameters:**

- `type`
- `postal_code`
- `radius_miles`
- `in_network`
- `limit`
- `cursor`

### `client.vendors.create_vendor`

`POST /vendors/v1/vendors`

Onboard a vendor

**Parameters:**

- `idempotency_key`

### `client.vendors.get_vendor`

`GET /vendors/v1/vendors/{vendorId}`

Get a vendor

**Parameters:**

- `vendor_id` (required)

### `client.vendors.update_vendor`

`PATCH /vendors/v1/vendors/{vendorId}`

Update a vendor

**Parameters:**

- `vendor_id` (required)

## WorkOrdersClient

### `client.work_orders.list_work_orders`

`GET /vendors/v1/work-orders`

List work orders

**Parameters:**

- `vendor_id`
- `claim_id`
- `status`
- `limit`
- `cursor`

### `client.work_orders.create_work_order`

`POST /vendors/v1/work-orders`

Create a work order

**Parameters:**

- `idempotency_key`

### `client.work_orders.get_work_order`

`GET /vendors/v1/work-orders/{workOrderId}`

Get a work order

**Parameters:**

- `work_order_id` (required)

### `client.work_orders.update_work_order`

`PATCH /vendors/v1/work-orders/{workOrderId}`

Update a work order

**Parameters:**

- `work_order_id` (required)
