from typing import Any, Optional, Union
from ..services.utils.validator import Validator
from ..services.utils.base_service import BaseService
from ..net.transport.serializer import Serializer
from ..net.transport.http_response import HttpResponse
from ..net.sdk_config import should_validate_response
from ..net.sdk_config import SdkConfig
from ..net.environment.environment import PostmanCusteduApiEnvironment
from ..models.utils.cast_models import cast_models
from ..models import (
    Driver,
    DriverCreate,
    DriverCreateRelationship,
    ListPolicyDriversResponse,
    Problem,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class DriversClient(BaseService):
    """
    Fern-style resource client for DriversClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_policy_drivers_config: SdkConfig = {}
        self._add_policy_driver_config: SdkConfig = {}

    def set_list_policy_drivers_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_policy_drivers.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_policy_drivers_config = config
        return self

    def set_add_policy_driver_config(self, config: SdkConfig):
        """
        Sets method-level configuration for add_policy_driver.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._add_policy_driver_config = config
        return self

    @property
    def with_raw_response(self) -> "RawDriversClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawDriversClient(self)

    @cast_models
    def list_policy_drivers(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> ListPolicyDriversResponse:
        """list_policy_drivers

        :param policy_id: Unique policy ID.
        :type policy_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ListPolicyDriversResponse
        """

        Validator(str).validate(policy_id, "policy_id")

        resolved_config = self._get_resolved_config(
            self._list_policy_drivers_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/policies/v1/policies/{{policyId}}/drivers",
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
                ListPolicyDriversResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def add_policy_driver(
        self,
        policy_id: str,
        *,
        first_name: str,
        last_name: str,
        date_of_birth: str,
        license_number: str,
        license_state: str,
        relationship: DriverCreateRelationship,
        request_config: Optional[SdkConfig] = None,
    ) -> Driver:
        """Adds a driver; may trigger a premium recalculation.

        :param request_body: The request body.
        :type request_body: DriverCreate
        :param policy_id: Unique policy ID.
        :type policy_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Driver
        """

        Validator(str).validate(policy_id, "policy_id")

        resolved_config = self._get_resolved_config(
            self._add_policy_driver_config, request_config
        )

        request_body = DriverCreate(
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            license_number=license_number,
            license_state=license_state,
            relationship=relationship,
        )
        Validator(DriverCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/policies/v1/policies/{{policyId}}/drivers",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("policyId", policy_id)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(404, Problem)
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
                Driver.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawDriversClient:
    """
    Raw-response client for DriversClient.

    Each method delegates to the matching :class:`DriversClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: DriversClient):
        self._client = client

    def list_policy_drivers(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPolicyDriversResponse]:
        data = self._client.list_policy_drivers(
            policy_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def add_policy_driver(
        self,
        policy_id: str,
        *,
        first_name: str,
        last_name: str,
        date_of_birth: str,
        license_number: str,
        license_state: str,
        relationship: DriverCreateRelationship,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Driver]:
        data = self._client.add_policy_driver(
            policy_id,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            license_number=license_number,
            license_state=license_state,
            relationship=relationship,
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncDriversClient(DriversClient):
    """
    Async wrapper for DriversClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawDriversClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawDriversClient(self)

    def list_policy_drivers(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[ListPolicyDriversResponse]:
        return to_async(super().list_policy_drivers)(
            policy_id, request_config=request_config
        )

    def add_policy_driver(
        self,
        policy_id: str,
        *,
        first_name: str,
        last_name: str,
        date_of_birth: str,
        license_number: str,
        license_state: str,
        relationship: DriverCreateRelationship,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Driver]:
        return to_async(super().add_policy_driver)(
            policy_id,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            license_number=license_number,
            license_state=license_state,
            relationship=relationship,
            request_config=request_config,
        )


class AsyncRawDriversClient:
    """
    Async raw-response client for AsyncDriversClient.
    """

    def __init__(self, client: AsyncDriversClient):
        self._client = client

    async def list_policy_drivers(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPolicyDriversResponse]:
        data = await self._client.list_policy_drivers(
            policy_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def add_policy_driver(
        self,
        policy_id: str,
        *,
        first_name: str,
        last_name: str,
        date_of_birth: str,
        license_number: str,
        license_state: str,
        relationship: DriverCreateRelationship,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Driver]:
        data = await self._client.add_policy_driver(
            policy_id,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            license_number=license_number,
            license_state=license_state,
            relationship=relationship,
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
