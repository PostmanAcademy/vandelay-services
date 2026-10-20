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
    ListCustomerVehiclesResponse,
    ListPolicyVehiclesResponse,
    Problem,
    Vehicle,
    VehicleCreate,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class VehiclesClient(BaseService):
    """
    Fern-style resource client for VehiclesClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_customer_vehicles_config: SdkConfig = {}
        self._add_customer_vehicle_config: SdkConfig = {}
        self._list_policy_vehicles_config: SdkConfig = {}

    def set_list_customer_vehicles_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_customer_vehicles.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_customer_vehicles_config = config
        return self

    def set_add_customer_vehicle_config(self, config: SdkConfig):
        """
        Sets method-level configuration for add_customer_vehicle.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._add_customer_vehicle_config = config
        return self

    def set_list_policy_vehicles_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_policy_vehicles.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_policy_vehicles_config = config
        return self

    @property
    def with_raw_response(self) -> "RawVehiclesClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawVehiclesClient(self)

    @cast_models
    def list_customer_vehicles(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> ListCustomerVehiclesResponse:
        """list_customer_vehicles

        :param customer_id: Unique customer ID.
        :type customer_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ListCustomerVehiclesResponse
        """

        Validator(str).validate(customer_id, "customer_id")

        resolved_config = self._get_resolved_config(
            self._list_customer_vehicles_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/customers/v1/customers/{{customerId}}/vehicles",
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
                ListCustomerVehiclesResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def add_customer_vehicle(
        self,
        customer_id: str,
        *,
        vin: str,
        year: int,
        make: str,
        model: str,
        trim: str = SENTINEL,
        color: str = SENTINEL,
        license_plate: str = SENTINEL,
        license_plate_state: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Vehicle:
        """add_customer_vehicle

        :param request_body: The request body.
        :type request_body: VehicleCreate
        :param customer_id: Unique customer ID.
        :type customer_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Vehicle
        """

        Validator(str).validate(customer_id, "customer_id")

        resolved_config = self._get_resolved_config(
            self._add_customer_vehicle_config, request_config
        )

        request_body = VehicleCreate(
            vin=vin,
            year=year,
            make=make,
            model=model,
            **{
                k: v
                for k, v in {
                    "trim": trim,
                    "color": color,
                    "license_plate": license_plate,
                    "license_plate_state": license_plate_state,
                }.items()
                if v is not SENTINEL
            },
        )
        Validator(VehicleCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/customers/v1/customers/{{customerId}}/vehicles",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("customerId", customer_id)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(404, Problem)
            .serialize()
            .set_method("POST")
            .set_body(request_body)
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                Vehicle.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def list_policy_vehicles(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> ListPolicyVehiclesResponse:
        """list_policy_vehicles

        :param policy_id: Unique policy ID.
        :type policy_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ListPolicyVehiclesResponse
        """

        Validator(str).validate(policy_id, "policy_id")

        resolved_config = self._get_resolved_config(
            self._list_policy_vehicles_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/policies/v1/policies/{{policyId}}/vehicles",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("policyId", policy_id)
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
                ListPolicyVehiclesResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawVehiclesClient:
    """
    Raw-response client for VehiclesClient.

    Each method delegates to the matching :class:`VehiclesClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: VehiclesClient):
        self._client = client

    def list_customer_vehicles(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListCustomerVehiclesResponse]:
        data = self._client.list_customer_vehicles(
            customer_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def add_customer_vehicle(
        self,
        customer_id: str,
        *,
        vin: str,
        year: int,
        make: str,
        model: str,
        trim: str = SENTINEL,
        color: str = SENTINEL,
        license_plate: str = SENTINEL,
        license_plate_state: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Vehicle]:
        data = self._client.add_customer_vehicle(
            customer_id,
            vin=vin,
            year=year,
            make=make,
            model=model,
            **{
                k: v
                for k, v in {
                    "trim": trim,
                    "color": color,
                    "license_plate": license_plate,
                    "license_plate_state": license_plate_state,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def list_policy_vehicles(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPolicyVehiclesResponse]:
        data = self._client.list_policy_vehicles(
            policy_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncVehiclesClient(VehiclesClient):
    """
    Async wrapper for VehiclesClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawVehiclesClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawVehiclesClient(self)

    def list_customer_vehicles(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[ListCustomerVehiclesResponse]:
        return to_async(super().list_customer_vehicles)(
            customer_id, request_config=request_config
        )

    def add_customer_vehicle(
        self,
        customer_id: str,
        *,
        vin: str,
        year: int,
        make: str,
        model: str,
        trim: str = SENTINEL,
        color: str = SENTINEL,
        license_plate: str = SENTINEL,
        license_plate_state: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Vehicle]:
        return to_async(super().add_customer_vehicle)(
            customer_id,
            vin=vin,
            year=year,
            make=make,
            model=model,
            **{
                k: v
                for k, v in {
                    "trim": trim,
                    "color": color,
                    "license_plate": license_plate,
                    "license_plate_state": license_plate_state,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def list_policy_vehicles(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[ListPolicyVehiclesResponse]:
        return to_async(super().list_policy_vehicles)(
            policy_id, request_config=request_config
        )


class AsyncRawVehiclesClient:
    """
    Async raw-response client for AsyncVehiclesClient.
    """

    def __init__(self, client: AsyncVehiclesClient):
        self._client = client

    async def list_customer_vehicles(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListCustomerVehiclesResponse]:
        data = await self._client.list_customer_vehicles(
            customer_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def add_customer_vehicle(
        self,
        customer_id: str,
        *,
        vin: str,
        year: int,
        make: str,
        model: str,
        trim: str = SENTINEL,
        color: str = SENTINEL,
        license_plate: str = SENTINEL,
        license_plate_state: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Vehicle]:
        data = await self._client.add_customer_vehicle(
            customer_id,
            vin=vin,
            year=year,
            make=make,
            model=model,
            **{
                k: v
                for k, v in {
                    "trim": trim,
                    "color": color,
                    "license_plate": license_plate,
                    "license_plate_state": license_plate_state,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def list_policy_vehicles(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPolicyVehiclesResponse]:
        data = await self._client.list_policy_vehicles(
            policy_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)
