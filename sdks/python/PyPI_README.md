# Api Python SDK 1.0.0<a id="api-python-sdk-100"></a>

Welcome to the Api SDK documentation. This guide will help you get started with integrating and using the Api SDK in your project.

## Versions<a id="versions"></a>

- SDK version: `1.0.0`

## About the API<a id="about-the-api"></a>

Manage Vandelay Industries customer profiles, contact details, vehicles, and communication preferences.

This API returns **PII** (names, phone numbers, addresses, dates of birth). When called by an agent,
traffic should flow through the Fabric Gateway so PII-redaction plugins can protect downstream LLMs.
Sensitive fields are returned masked unless the caller holds the `customers:pii:read` scope.

### Authentication and rate limits<a id="authentication-and-rate-limits"></a>

- Send `Authorization: Bearer <token>`; see `bearerAuth` for the token format and personas.
- Each token is limited to 600 requests per minute. Responses include `X-RateLimit-Limit` and `X-RateLimit-Remaining`;
  over the limit you receive `429` with `Retry-After`.
- A `POST` retried with the same `Idempotency-Key` and body replays the original response and adds `Idempotent-Replayed: true`.
- `customers:pii:read` unmasks `dateOfBirth`. `customers:delete` is required to deactivate a customer (`DELETE /customers/v1/customers/{customerId}`, otherwise `403`).

## Table of Contents<a id="table-of-contents"></a>

- [Setup & Configuration](#setup--configuration)
  - [Supported Language Versions](#supported-language-versions)
  - [Installation](#installation)
- [Authentication](#authentication)
  - [Access Token Authentication](#access-token-authentication)
- [Setting a Custom Timeout](#setting-a-custom-timeout)
- [Sample Usage](#sample-usage)
- [Services](#services)
- [Models](#models)

# Setup & Configuration<a id="setup--configuration"></a>

## Supported Language Versions<a id="supported-language-versions"></a>

This SDK is compatible with the following versions: `Python >= 3.9`

## Installation<a id="installation"></a>

To get started with the SDK, we recommend installing using `pip`:

```bash
pip install postman_custedu
```

If you are using Python 3, you can use `pip3` instead:

```bash
pip3 install postman_custedu
```

## Disabling Redirects<a id="disabling-redirects"></a>

By default, the SDK follows HTTP redirects (3xx responses) automatically. Pass
`follow_redirects=False` to get the redirect response back as-is instead:

```python
client = PostmanCusteduApi(follow_redirects=False)
```

This can also be changed later with `client.set_follow_redirects(False)`.

## Logging<a id="logging"></a>

The SDK is silent by default. Pass a standard library `logging.Logger` as `logger` to log
every outgoing request and its response (method, URL, status, and duration):

```python
import logging

logger = logging.getLogger("PostmanCusteduApi")
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

client = PostmanCusteduApi(logger=logger)
```

This can also be changed later with `client.set_logging(logger)`.

`Authorization` and `Cookie` header values are always redacted in logged output, regardless
of the logger's own configuration.

## Authentication<a id="authentication"></a>

### Access Token Authentication<a id="access-token-authentication"></a>

The PostmanCusteduApi API uses an Access Token for authentication.

This token must be provided to authenticate your requests to the API.

#### Setting the Access Token<a id="setting-the-access-token"></a>

When you initialize the SDK, you can set the access token as follows:

```py
PostmanCusteduApi(
    access_token="YOUR_ACCESS_TOKEN",
    timeout=10
)
```

If you need to set or update the access token after initializing the SDK, you can use:

```py
sdk.set_access_token("YOUR_ACCESS_TOKEN")
```

## Setting a Custom Timeout<a id="setting-a-custom-timeout"></a>

You can set a custom timeout for the SDK's HTTP requests as follows:

```py
from postman_custedu import PostmanCusteduApi

sdk = PostmanCusteduApi(timeout=10)
```

# Sample Usage<a id="sample-usage"></a>

Below is a comprehensive example demonstrating how to authenticate and call a simple endpoint:

```py
from postman_custedu import PostmanCusteduApi, PostmanCusteduApiEnvironment

sdk = PostmanCusteduApi(
    access_token="YOUR_ACCESS_TOKEN",
    base_url=PostmanCusteduApiEnvironment.DEFAULT.value,
    timeout=10
)

result = sdk.customers.list_customers(
    email="Ronald47@gmail.com",
    phone="phone",
    last_name="lastName",
    limit=20,
    cursor="cursor"
)

print(result)

```

# Async Usage<a id="async-usage"></a>

The SDK includes an Async Client for making asynchronous API requests. This is useful for applications that need non-blocking operations, like web servers or apps with a graphical user interface.

```py
import asyncio
from postman_custedu import AsyncPostmanCusteduApi, PostmanCusteduApiEnvironment

sdk = AsyncPostmanCusteduApi(
    access_token="YOUR_ACCESS_TOKEN",
    base_url=PostmanCusteduApiEnvironment.DEFAULT.value,
    timeout=10
)


async def main():
  result = await sdk.customers.list_customers(
    email="Ronald47@gmail.com",
    phone="phone",
    last_name="lastName",
    limit=20,
    cursor="cursor"
)
  print(result)

asyncio.run(main())
```

## Services<a id="services"></a>

The SDK provides various services to interact with the API.

<details> 
<summary>Below is a list of all available services:</summary>

| Name                  |
| :-------------------- |
| customers             |
| vehicles              |
| preferences           |
| policies              |
| coverages             |
| drivers               |
| coverage_verification |
| claims                |
| notes                 |
| assignments           |
| timeline              |
| payments              |
| refunds               |
| payment_methods       |
| vendors               |
| work_orders           |

</details>

## Models<a id="models"></a>

The SDK includes several models that represent the data structures used in API requests and responses. These models help in organizing and managing the data efficiently.

<details> 
<summary>Below is a list of all available models:</summary>

| Name                         | Description |
| :--------------------------- | :---------- |
| CustomerList                 |             |
| CustomerCreate               |             |
| Customer                     |             |
| CustomerUpdate               |             |
| ListCustomerVehiclesResponse |             |
| VehicleCreate                |             |
| Vehicle                      |             |
| ListPolicyVehiclesResponse   |             |
| Preferences                  |             |
| PolicyList                   |             |
| PolicyStatus                 |             |
| PolicyDetail                 |             |
| ListPolicyCoveragesResponse  |             |
| ListPolicyDriversResponse    |             |
| DriverCreate                 |             |
| Driver                       |             |
| CoverageVerificationRequest  |             |
| CoverageVerification         |             |
| ClaimList                    |             |
| ClaimStatus                  |             |
| ClaimCreate                  |             |
| Claim                        |             |
| ClaimUpdate                  |             |
| CancelRequest                |             |
| ListClaimNotesResponse       |             |
| NoteCreate                   |             |
| Note                         |             |
| ListClaimAssignmentsResponse |             |
| AssignmentCreate             |             |
| Assignment                   |             |
| GetClaimTimelineResponse     |             |
| PaymentList                  |             |
| PaymentStatus                |             |
| PaymentCreate                |             |
| Payment                      |             |
| ApprovePaymentRequest        |             |
| CancelPaymentRequest         |             |
| ListPaymentRefundsResponse   |             |
| RefundCreate                 |             |
| Refund                       |             |
| ListPaymentMethodsResponse   |             |
| PaymentMethodCreate          |             |
| PaymentMethod                |             |
| VendorList                   |             |
| VendorType                   |             |
| VendorCreate                 |             |
| Vendor                       |             |
| VendorUpdate                 |             |
| ListWorkOrdersResponse       |             |
| WorkOrderStatus              |             |
| WorkOrderCreate              |             |
| WorkOrder                    |             |
| WorkOrderUpdate              |             |
| Money                        |             |
| Address                      |             |
| InsuredVehicle               |             |
| Policy                       |             |
| Coverage                     |             |
| ClaimType                    |             |
| TimelineEvent                |             |
| Payee                        |             |
| PaymentRail                  |             |
| Problem                      |             |

</details>
