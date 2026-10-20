# Reference

## Customers

<details><summary><code>client.customers.<a href="/src/api/resources/customers/client/Client.ts">listCustomers</a>({ ...params }) -> PostmanCusteduApi.CustomerList</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Search customers by email, phone, or last name. At least one filter is required.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.customers.listCustomers({
  email: 'Ronald47@gmail.com',
  phone: 'phone',
  lastName: 'lastName',
  limit: 20,
  cursor: 'cursor',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListCustomersRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CustomersClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.customers.<a href="/src/api/resources/customers/client/Client.ts">createCustomer</a>({ ...params }) -> PostmanCusteduApi.Customer</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.customers.createCustomer({
  Idempotency_Key: 'Idempotency-Key',
  body: customerCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.CustomerCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CustomersClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.customers.<a href="/src/api/resources/customers/client/Client.ts">getCustomer</a>({ ...params }) -> PostmanCusteduApi.Customer</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.customers.getCustomer({
  customerId: 'cus_tOUmqKOyHU',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.GetCustomerRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CustomersClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.customers.<a href="/src/api/resources/customers/client/Client.ts">updateCustomer</a>({ ...params }) -> PostmanCusteduApi.Customer</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.customers.updateCustomer({
  customerId: 'cus_tOUmqKOyHU',
  body: customerUpdate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.CustomerUpdate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CustomersClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.customers.<a href="/src/api/resources/customers/client/Client.ts">deleteCustomer</a>({ ...params })</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Soft-deletes the customer by setting status to `inactive`. Requires the `customers:delete` scope (otherwise `403`). Customers with open claims (`draft`, `submitted`, `under_review`, `approved`, or `settled`) cannot be deleted.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.customers.deleteCustomer({
  customerId: 'cus_tOUmqKOyHU',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.DeleteCustomerRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CustomersClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Vehicles

<details><summary><code>client.vehicles.<a href="/src/api/resources/vehicles/client/Client.ts">listCustomerVehicles</a>({ ...params }) -> PostmanCusteduApi.ListCustomerVehiclesResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vehicles.listCustomerVehicles({
  customerId: 'cus_arx2c32pl',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListCustomerVehiclesRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VehiclesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.vehicles.<a href="/src/api/resources/vehicles/client/Client.ts">addCustomerVehicle</a>({ ...params }) -> PostmanCusteduApi.Vehicle</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vehicles.addCustomerVehicle({
  customerId: 'cus_arx2c32pl',
  body: vehicleCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.VehicleCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VehiclesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.vehicles.<a href="/src/api/resources/vehicles/client/Client.ts">listPolicyVehicles</a>({ ...params }) -> PostmanCusteduApi.ListPolicyVehiclesResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vehicles.listPolicyVehicles({
  policyId: 'pol_TAB-54528395',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListPolicyVehiclesRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VehiclesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Preferences

<details><summary><code>client.preferences.<a href="/src/api/resources/preferences/client/Client.ts">getCustomerPreferences</a>({ ...params }) -> PostmanCusteduApi.Preferences</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.preferences.getCustomerPreferences({
  customerId: 'cus_I',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.GetCustomerPreferencesRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PreferencesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.preferences.<a href="/src/api/resources/preferences/client/Client.ts">replaceCustomerPreferences</a>({ ...params }) -> PostmanCusteduApi.Preferences</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.preferences.replaceCustomerPreferences({
  customerId: 'cus_I',
  body: preferences,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ReplaceCustomerPreferencesRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PreferencesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Policies

<details><summary><code>client.policies.<a href="/src/api/resources/policies/client/Client.ts">listPolicies</a>({ ...params }) -> PostmanCusteduApi.PolicyList</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.policies.listPolicies({
  customerId: 'customerId',
  status: 'quoted',
  vin: 'vin',
  limit: 20,
  cursor: 'cursor',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListPoliciesRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PoliciesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.policies.<a href="/src/api/resources/policies/client/Client.ts">getPolicy</a>({ ...params }) -> PostmanCusteduApi.PolicyDetail</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the policy with its coverages, vehicles, and drivers.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.policies.getPolicy({
  policyId: 'pol_MJU-00252952',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.GetPolicyRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PoliciesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Coverages

<details><summary><code>client.coverages.<a href="/src/api/resources/coverages/client/Client.ts">listPolicyCoverages</a>({ ...params }) -> PostmanCusteduApi.ListPolicyCoveragesResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.coverages.listPolicyCoverages({
  policyId: 'pol_AVR-91',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListPolicyCoveragesRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CoveragesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Drivers

<details><summary><code>client.drivers.<a href="/src/api/resources/drivers/client/Client.ts">listPolicyDrivers</a>({ ...params }) -> PostmanCusteduApi.ListPolicyDriversResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.drivers.listPolicyDrivers({
  policyId: 'pol_QZN-7',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListPolicyDriversRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DriversClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.drivers.<a href="/src/api/resources/drivers/client/Client.ts">addPolicyDriver</a>({ ...params }) -> PostmanCusteduApi.Driver</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Adds a driver; may trigger a premium recalculation.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.drivers.addPolicyDriver({
  policyId: 'pol_QZN-7',
  body: driverCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.DriverCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DriversClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## CoverageVerification

<details><summary><code>client.coverageVerification.<a href="/src/api/resources/coverageVerification/client/Client.ts">verifyCoverage</a>({ ...params }) -> PostmanCusteduApi.CoverageVerification</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Checks whether the policy and vehicle were covered on the loss date for the given claim type, and returns applicable coverage, limit, and deductible. A policy that is not covered returns `200` with `covered: false` and a `reasons` list. Use `404` only when the policy does not exist.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.coverageVerification.verifyCoverage({
  policyId: 'pol_DTF-86776929617',
  body: coverageVerificationRequest_3,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.CoverageVerificationRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `CoverageVerificationClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Claims

<details><summary><code>client.claims.<a href="/src/api/resources/claims/client/Client.ts">listClaims</a>({ ...params }) -> PostmanCusteduApi.ClaimList</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns a paginated list of claims, newest first. Filter by status, customer, or policy.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.claims.listClaims({
  status: 'draft',
  customerId: 'customerId',
  policyId: 'policyId',
  limit: 20,
  cursor: 'cursor',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListClaimsRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ClaimsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.claims.<a href="/src/api/resources/claims/client/Client.ts">createClaim</a>({ ...params }) -> PostmanCusteduApi.Claim</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Creates a new claim. The policy must be active on the loss date; coverage is validated against the Policy API. Set `submit` to `true` to move straight to `submitted`; otherwise the claim is created as a `draft`. The customer must be `active` and own the policy, and a `vehicleId` must be insured on it. The `deductible` comes from the coverage that pays for the loss type. A second claim for the same policy, vehicle, type, and loss date returns `409`.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.claims.createClaim({
  Idempotency_Key: 'Idempotency-Key',
  body: claimCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ClaimCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ClaimsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.claims.<a href="/src/api/resources/claims/client/Client.ts">getClaim</a>({ ...params }) -> PostmanCusteduApi.Claim</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.claims.getClaim({
  claimId: 'clm_3121-553768',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.GetClaimRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ClaimsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.claims.<a href="/src/api/resources/claims/client/Client.ts">updateClaim</a>({ ...params }) -> PostmanCusteduApi.Claim</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Partially updates a claim. Only `draft`, `submitted`, and `under_review` claims can be modified. Status only moves forward (`draft` to `submitted` to `under_review` to `approved` or `denied`); an adjuster must be assigned before `under_review` and an estimate set before `approved`. Use `POST /claims/v1/claims/{claimId}/cancel` to cancel. The approved amount is the estimate less the deductible.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.claims.updateClaim({
  claimId: 'clm_3121-553768',
  body: claimUpdate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ClaimUpdate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ClaimsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.claims.<a href="/src/api/resources/claims/client/Client.ts">cancelClaim</a>({ ...params }) -> PostmanCusteduApi.Claim</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Cancels a claim that has not yet been settled. Open vendor assignments and any payments still `pending_approval` or `processing` are cancelled with it.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.claims.cancelClaim({
  claimId: 'clm_9939-262406',
  body: cancelRequest,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.CancelRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ClaimsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Notes

<details><summary><code>client.notes.<a href="/src/api/resources/notes/client/Client.ts">listClaimNotes</a>({ ...params }) -> PostmanCusteduApi.ListClaimNotesResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.notes.listClaimNotes({
  claimId: 'clm_5398-257410',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListClaimNotesRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `NotesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.notes.<a href="/src/api/resources/notes/client/Client.ts">addClaimNote</a>({ ...params }) -> PostmanCusteduApi.Note</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.notes.addClaimNote({
  claimId: 'clm_5398-257410',
  body: noteCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.NoteCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `NotesClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Assignments

<details><summary><code>client.assignments.<a href="/src/api/resources/assignments/client/Client.ts">listClaimAssignments</a>({ ...params }) -> PostmanCusteduApi.ListClaimAssignmentsResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.assignments.listClaimAssignments({
  claimId: 'clm_6555-519848',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListClaimAssignmentsRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AssignmentsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.assignments.<a href="/src/api/resources/assignments/client/Client.ts">assignVendorToClaim</a>({ ...params }) -> PostmanCusteduApi.Assignment</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Requests a vendor (from the Vendors API) to perform work on the claim.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.assignments.assignVendorToClaim({
  claimId: 'clm_6555-519848',
  body: assignmentCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.AssignmentCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AssignmentsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Timeline

<details><summary><code>client.timeline.<a href="/src/api/resources/timeline/client/Client.ts">getClaimTimeline</a>({ ...params }) -> PostmanCusteduApi.GetClaimTimelineResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Chronological audit trail of events for the claim.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.timeline.getClaimTimeline({
  claimId: 'clm_1268-683470',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.GetClaimTimelineRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `TimelineClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Payments

<details><summary><code>client.payments.<a href="/src/api/resources/payments/client/Client.ts">listPayments</a>({ ...params }) -> PostmanCusteduApi.PaymentList</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.payments.listPayments({
  claimId: 'claimId',
  payeeId: 'payeeId',
  status: 'pending_approval',
  limit: 20,
  cursor: 'cursor',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListPaymentsRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PaymentsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.payments.<a href="/src/api/resources/payments/client/Client.ts">createPayment</a>({ ...params }) -> PostmanCusteduApi.Payment</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Creates a payment for an approved claim. The amount cannot exceed the claim's remaining approved balance (the estimate less the deductible, minus payments already made and refunded). Requires the `payments:write` scope. Payments over the approval threshold start in `pending_approval`; all others start in `processing`.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.payments.createPayment({
  Idempotency_Key: 'Idempotency-Key',
  body: paymentCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.PaymentCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PaymentsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.payments.<a href="/src/api/resources/payments/client/Client.ts">getPayment</a>({ ...params }) -> PostmanCusteduApi.Payment</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.payments.getPayment({
  paymentId: 'pay_59860018186',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.GetPaymentRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PaymentsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.payments.<a href="/src/api/resources/payments/client/Client.ts">approvePayment</a>({ ...params }) -> PostmanCusteduApi.Payment</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Requires the `payments:approve` scope. The approver must differ from the creator.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.payments.approvePayment({
  paymentId: 'pay_97519870324',
  body: approvePaymentRequest,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ApprovePaymentRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PaymentsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.payments.<a href="/src/api/resources/payments/client/Client.ts">cancelPayment</a>({ ...params }) -> PostmanCusteduApi.Payment</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Only payments in `pending_approval` or `processing` (before bank submission) can be cancelled.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.payments.cancelPayment({
  paymentId: 'pay_255',
  body: cancelPaymentRequest,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.CancelPaymentRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PaymentsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Refunds

<details><summary><code>client.refunds.<a href="/src/api/resources/refunds/client/Client.ts">listPaymentRefunds</a>({ ...params }) -> PostmanCusteduApi.ListPaymentRefundsResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.refunds.listPaymentRefunds({
  paymentId: 'pay_7909172184',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListPaymentRefundsRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `RefundsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.refunds.<a href="/src/api/resources/refunds/client/Client.ts">createPaymentRefund</a>({ ...params }) -> PostmanCusteduApi.Refund</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Only `completed` payments can be refunded, up to the amount not already refunded. The refund completes automatically after the settlement delay.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.refunds.createPaymentRefund({
  paymentId: 'pay_7909172184',
  Idempotency_Key: 'Idempotency-Key',
  body: refundCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.RefundCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `RefundsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## PaymentMethods

<details><summary><code>client.paymentMethods.<a href="/src/api/resources/paymentMethods/client/Client.ts">listPaymentMethods</a>({ ...params }) -> PostmanCusteduApi.ListPaymentMethodsResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns tokenized payout destinations for a payee. Account numbers are never returned; only the last four digits.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.paymentMethods.listPaymentMethods({
  payeeId: 'payeeId',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListPaymentMethodsRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PaymentMethodsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.paymentMethods.<a href="/src/api/resources/paymentMethods/client/Client.ts">createPaymentMethod</a>({ ...params }) -> PostmanCusteduApi.PaymentMethod</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Registers a payout destination using a single-use `token` created by the Vandelay hosted payment form. Raw account numbers are never accepted.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.paymentMethods.createPaymentMethod(paymentMethodCreate);
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.PaymentMethodCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PaymentMethodsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## Vendors

<details><summary><code>client.vendors.<a href="/src/api/resources/vendors/client/Client.ts">listVendors</a>({ ...params }) -> PostmanCusteduApi.VendorList</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Find vendors by service type and proximity. Results are sorted by distance when `postalCode` is supplied.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vendors.listVendors({
  type: 'repair',
  postalCode: 'postalCode',
  radiusMiles: 25,
  inNetwork: true,
  limit: 20,
  cursor: 'cursor',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListVendorsRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VendorsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.vendors.<a href="/src/api/resources/vendors/client/Client.ts">createVendor</a>({ ...params }) -> PostmanCusteduApi.Vendor</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vendors.createVendor({
  Idempotency_Key: 'Idempotency-Key',
  body: vendorCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.VendorCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VendorsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.vendors.<a href="/src/api/resources/vendors/client/Client.ts">getVendor</a>({ ...params }) -> PostmanCusteduApi.Vendor</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vendors.getVendor({
  vendorId: 'ven_611484537',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.GetVendorRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VendorsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.vendors.<a href="/src/api/resources/vendors/client/Client.ts">updateVendor</a>({ ...params }) -> PostmanCusteduApi.Vendor</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Suspending or terminating a vendor also removes it from the preferred network (`inNetwork` becomes `false`).

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.vendors.updateVendor({
  vendorId: 'ven_611484537',
  body: vendorUpdate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.VendorUpdate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VendorsClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

## WorkOrders

<details><summary><code>client.workOrders.<a href="/src/api/resources/workOrders/client/Client.ts">listWorkOrders</a>({ ...params }) -> PostmanCusteduApi.ListWorkOrdersResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.workOrders.listWorkOrders({
  vendorId: 'vendorId',
  claimId: 'claimId',
  status: 'issued',
  limit: 20,
  cursor: 'cursor',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.ListWorkOrdersRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WorkOrdersClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.workOrders.<a href="/src/api/resources/workOrders/client/Client.ts">createWorkOrder</a>({ ...params }) -> PostmanCusteduApi.WorkOrder</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Issues a work order to a vendor for a claim. The vendor must be `active` and serve the loss location. The same engagement appears in the Claims API as an assignment.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.workOrders.createWorkOrder({
  Idempotency_Key: 'Idempotency-Key',
  body: workOrderCreate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.WorkOrderCreate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WorkOrdersClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.workOrders.<a href="/src/api/resources/workOrders/client/Client.ts">getWorkOrder</a>({ ...params }) -> PostmanCusteduApi.WorkOrder</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.workOrders.getWorkOrder({
  workOrderId: 'wo_8139',
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.GetWorkOrderRequest`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WorkOrdersClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>

<details><summary><code>client.workOrders.<a href="/src/api/resources/workOrders/client/Client.ts">updateWorkOrder</a>({ ...params }) -> PostmanCusteduApi.WorkOrder</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Vendors use this endpoint to accept, schedule, submit estimates, and complete work. Status moves `issued` to `accepted` to `in_progress` to `completed` (or `declined` or `cancelled`), and an estimate can be submitted once the work order is accepted.

</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.workOrders.updateWorkOrder({
  workOrderId: 'wo_8139',
  body: workOrderUpdate,
});
```

</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `PostmanCusteduApi.WorkOrderUpdate`

</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WorkOrdersClient.RequestOptions`

</dd>
</dl>
</dd>
</dl>

</dd>
</dl>
</details>
