from typing import Any, Optional, Union
from ..services.utils.validator import Validator
from ..services.utils.base_service import BaseService
from ..net.transport.serializer import Serializer
from ..net.transport.http_response import HttpResponse
from ..net.sdk_config import should_validate_response
from ..net.sdk_config import SdkConfig
from ..net.environment.environment import PostmanCusteduApiEnvironment
from ..models.utils.sentinel import SENTINEL
from ..models.utils.cast_models import cast_models
from ..models import (
    Address,
    Customer,
    CustomerCreate,
    CustomerList,
    CustomerUpdate,
    Preferences,
    Problem,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class CustomersClient(BaseService):
    """
    Fern-style resource client for CustomersClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_customers_config: SdkConfig = {}
        self._create_customer_config: SdkConfig = {}
        self._get_customer_config: SdkConfig = {}
        self._update_customer_config: SdkConfig = {}
        self._delete_customer_config: SdkConfig = {}

    def set_list_customers_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_customers.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_customers_config = config
        return self

    def set_create_customer_config(self, config: SdkConfig):
        """
        Sets method-level configuration for create_customer.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._create_customer_config = config
        return self

    def set_get_customer_config(self, config: SdkConfig):
        """
        Sets method-level configuration for get_customer.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._get_customer_config = config
        return self

    def set_update_customer_config(self, config: SdkConfig):
        """
        Sets method-level configuration for update_customer.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._update_customer_config = config
        return self

    def set_delete_customer_config(self, config: SdkConfig):
        """
        Sets method-level configuration for delete_customer.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._delete_customer_config = config
        return self

    @property
    def with_raw_response(self) -> "RawCustomersClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawCustomersClient(self)

    @cast_models
    def list_customers(
        self,
        *,
        email: str = SENTINEL,
        phone: str = SENTINEL,
        last_name: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> CustomerList:
        """Search customers by email, phone, or last name. At least one filter is required.

        :param email: Exact email match., defaults to None
        :type email: str, optional
        :param phone: Phone number in E.164 format., defaults to None
        :type phone: str, optional
        :param last_name: Case-insensitive last name prefix., defaults to None
        :type last_name: str, optional
        :param limit: Maximum number of items to return., defaults to None
        :type limit: int, optional
        :param cursor: Opaque cursor from a previous response's `nextCursor`., defaults to None
        :type cursor: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: CustomerList
        """

        Validator(str).is_optional().validate(email, "email")
        Validator(str).is_optional().validate(phone, "phone")
        Validator(str).is_optional().validate(last_name, "last_name")
        Validator(int).is_optional().validate(limit, "limit")
        Validator(str).is_optional().validate(cursor, "cursor")

        resolved_config = self._get_resolved_config(
            self._list_customers_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/customers/v1/customers",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_query("email", email)
            .add_query("phone", phone)
            .add_query("lastName", last_name)
            .add_query("limit", limit)
            .add_query("cursor", cursor)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(429, Problem)
            .serialize()
            .set_method("GET")
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                CustomerList.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def create_customer(
        self,
        *,
        first_name: str,
        last_name: str,
        email: str,
        phone: str = SENTINEL,
        date_of_birth: str = SENTINEL,
        address: Address = SENTINEL,
        preferences: Preferences = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Customer:
        """create_customer

        :param request_body: The request body.
        :type request_body: CustomerCreate
        :param idempotency_key: Unique key (UUID recommended) so retries do not create duplicate resources. Retrying with the same key and body returns the original response with `Idempotent-Replayed: true`; reusing a key with a different body is rejected., defaults to None
        :type idempotency_key: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Customer
        """

        Validator(str).is_optional().validate(idempotency_key, "idempotency_key")

        resolved_config = self._get_resolved_config(
            self._create_customer_config, request_config
        )

        request_body = CustomerCreate(
            first_name=first_name,
            last_name=last_name,
            email=email,
            **{
                k: v
                for k, v in {
                    "phone": phone,
                    "date_of_birth": date_of_birth,
                    "address": address,
                    "preferences": preferences,
                }.items()
                if v is not SENTINEL
            },
        )
        Validator(CustomerCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/customers/v1/customers",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_header("Idempotency-Key", idempotency_key)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(409, Problem)
            .serialize()
            .set_method("POST")
            .set_body(request_body)
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                Customer.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def get_customer(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Customer:
        """get_customer

        :param customer_id: Unique customer ID.
        :type customer_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Customer
        """

        Validator(str).validate(customer_id, "customer_id")

        resolved_config = self._get_resolved_config(
            self._get_customer_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/customers/v1/customers/{{customerId}}",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("customerId", customer_id)
            .add_error(401, Problem)
            .add_error(404, Problem)
            .serialize()
            .set_method("GET")
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                Customer.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def update_customer(
        self,
        customer_id: str,
        *,
        first_name: str = SENTINEL,
        last_name: str = SENTINEL,
        email: str = SENTINEL,
        phone: str = SENTINEL,
        address: Address = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Customer:
        """update_customer

        :param request_body: The request body.
        :type request_body: CustomerUpdate
        :param customer_id: Unique customer ID.
        :type customer_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Customer
        """

        Validator(str).validate(customer_id, "customer_id")

        resolved_config = self._get_resolved_config(
            self._update_customer_config, request_config
        )

        request_body = CustomerUpdate(
            **{
                k: v
                for k, v in {
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "phone": phone,
                    "address": address,
                }.items()
                if v is not SENTINEL
            }
        )
        Validator(CustomerUpdate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/customers/v1/customers/{{customerId}}",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("customerId", customer_id)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(404, Problem)
            .serialize()
            .set_method("PATCH")
            .set_body(request_body)
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                Customer.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def delete_customer(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> None:
        """Soft-deletes the customer by setting status to `inactive`. Requires the `customers:delete` scope (otherwise `403`). Customers with open claims (`draft`, `submitted`, `under_review`, `approved`, or `settled`) cannot be deleted.

        :param customer_id: Unique customer ID.
        :type customer_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: None
        """

        Validator(str).validate(customer_id, "customer_id")

        resolved_config = self._get_resolved_config(
            self._delete_customer_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/customers/v1/customers/{{customerId}}",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("customerId", customer_id)
            .add_error(401, Problem)
            .add_error(403, Problem)
            .add_error(404, Problem)
            .add_error(409, Problem)
            .serialize()
            .set_method("DELETE")
        )

        response, status, content = self.send_request(serialized_request)


class RawCustomersClient:
    """
    Raw-response client for CustomersClient.

    Each method delegates to the matching :class:`CustomersClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: CustomersClient):
        self._client = client

    def list_customers(
        self,
        *,
        email: str = SENTINEL,
        phone: str = SENTINEL,
        last_name: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[CustomerList]:
        data = self._client.list_customers(
            **{
                k: v
                for k, v in {
                    "email": email,
                    "phone": phone,
                    "last_name": last_name,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def create_customer(
        self,
        *,
        first_name: str,
        last_name: str,
        email: str,
        phone: str = SENTINEL,
        date_of_birth: str = SENTINEL,
        address: Address = SENTINEL,
        preferences: Preferences = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Customer]:
        data = self._client.create_customer(
            first_name=first_name,
            last_name=last_name,
            email=email,
            **{
                k: v
                for k, v in {
                    "phone": phone,
                    "date_of_birth": date_of_birth,
                    "address": address,
                    "preferences": preferences,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def get_customer(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Customer]:
        data = self._client.get_customer(customer_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)

    def update_customer(
        self,
        customer_id: str,
        *,
        first_name: str = SENTINEL,
        last_name: str = SENTINEL,
        email: str = SENTINEL,
        phone: str = SENTINEL,
        address: Address = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Customer]:
        data = self._client.update_customer(
            customer_id,
            **{
                k: v
                for k, v in {
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "phone": phone,
                    "address": address,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def delete_customer(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[None]:
        data = self._client.delete_customer(customer_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncCustomersClient(CustomersClient):
    """
    Async wrapper for CustomersClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawCustomersClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawCustomersClient(self)

    def list_customers(
        self,
        *,
        email: str = SENTINEL,
        phone: str = SENTINEL,
        last_name: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[CustomerList]:
        return to_async(super().list_customers)(
            **{
                k: v
                for k, v in {
                    "email": email,
                    "phone": phone,
                    "last_name": last_name,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def create_customer(
        self,
        *,
        first_name: str,
        last_name: str,
        email: str,
        phone: str = SENTINEL,
        date_of_birth: str = SENTINEL,
        address: Address = SENTINEL,
        preferences: Preferences = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Customer]:
        return to_async(super().create_customer)(
            first_name=first_name,
            last_name=last_name,
            email=email,
            **{
                k: v
                for k, v in {
                    "phone": phone,
                    "date_of_birth": date_of_birth,
                    "address": address,
                    "preferences": preferences,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def get_customer(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[Customer]:
        return to_async(super().get_customer)(
            customer_id, request_config=request_config
        )

    def update_customer(
        self,
        customer_id: str,
        *,
        first_name: str = SENTINEL,
        last_name: str = SENTINEL,
        email: str = SENTINEL,
        phone: str = SENTINEL,
        address: Address = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Customer]:
        return to_async(super().update_customer)(
            customer_id,
            **{
                k: v
                for k, v in {
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "phone": phone,
                    "address": address,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def delete_customer(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[None]:
        return to_async(super().delete_customer)(
            customer_id, request_config=request_config
        )


class AsyncRawCustomersClient:
    """
    Async raw-response client for AsyncCustomersClient.
    """

    def __init__(self, client: AsyncCustomersClient):
        self._client = client

    async def list_customers(
        self,
        *,
        email: str = SENTINEL,
        phone: str = SENTINEL,
        last_name: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[CustomerList]:
        data = await self._client.list_customers(
            **{
                k: v
                for k, v in {
                    "email": email,
                    "phone": phone,
                    "last_name": last_name,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def create_customer(
        self,
        *,
        first_name: str,
        last_name: str,
        email: str,
        phone: str = SENTINEL,
        date_of_birth: str = SENTINEL,
        address: Address = SENTINEL,
        preferences: Preferences = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Customer]:
        data = await self._client.create_customer(
            first_name=first_name,
            last_name=last_name,
            email=email,
            **{
                k: v
                for k, v in {
                    "phone": phone,
                    "date_of_birth": date_of_birth,
                    "address": address,
                    "preferences": preferences,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def get_customer(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Customer]:
        data = await self._client.get_customer(
            customer_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def update_customer(
        self,
        customer_id: str,
        *,
        first_name: str = SENTINEL,
        last_name: str = SENTINEL,
        email: str = SENTINEL,
        phone: str = SENTINEL,
        address: Address = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Customer]:
        data = await self._client.update_customer(
            customer_id,
            **{
                k: v
                for k, v in {
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "phone": phone,
                    "address": address,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def delete_customer(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[None]:
        data = await self._client.delete_customer(
            customer_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)
