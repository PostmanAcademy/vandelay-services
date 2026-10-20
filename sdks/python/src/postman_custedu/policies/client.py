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
from ..models import PolicyDetail, PolicyList, PolicyStatus, Problem
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class PoliciesClient(BaseService):
    """
    Fern-style resource client for PoliciesClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_policies_config: SdkConfig = {}
        self._get_policy_config: SdkConfig = {}

    def set_list_policies_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_policies.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_policies_config = config
        return self

    def set_get_policy_config(self, config: SdkConfig):
        """
        Sets method-level configuration for get_policy.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._get_policy_config = config
        return self

    @property
    def with_raw_response(self) -> "RawPoliciesClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawPoliciesClient(self)

    @cast_models
    def list_policies(
        self,
        *,
        customer_id: str = SENTINEL,
        status: PolicyStatus = SENTINEL,
        vin: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> PolicyList:
        """list_policies

        :param customer_id: Filter by policyholder., defaults to None
        :type customer_id: str, optional
        :param status: Filter by status., defaults to None
        :type status: PolicyStatus, optional
        :param vin: Find policies insuring this VIN., defaults to None
        :type vin: str, optional
        :param limit: Maximum number of items to return., defaults to None
        :type limit: int, optional
        :param cursor: Opaque cursor from a previous response's `nextCursor`., defaults to None
        :type cursor: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: PolicyList
        """

        Validator(str).is_optional().validate(customer_id, "customer_id")
        Validator(PolicyStatus).is_optional().validate(status, "status")
        Validator(str).is_optional().validate(vin, "vin")
        Validator(int).is_optional().validate(limit, "limit")
        Validator(str).is_optional().validate(cursor, "cursor")

        resolved_config = self._get_resolved_config(
            self._list_policies_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/policies/v1/policies",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_query("customerId", customer_id)
            .add_query("status", status)
            .add_query("vin", vin)
            .add_query("limit", limit)
            .add_query("cursor", cursor)
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
                PolicyList.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def get_policy(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> PolicyDetail:
        """Returns the policy with its coverages, vehicles, and drivers.

        :param policy_id: Unique policy ID.
        :type policy_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: PolicyDetail
        """

        Validator(str).validate(policy_id, "policy_id")

        resolved_config = self._get_resolved_config(
            self._get_policy_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/policies/v1/policies/{{policyId}}",
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
                PolicyDetail.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawPoliciesClient:
    """
    Raw-response client for PoliciesClient.

    Each method delegates to the matching :class:`PoliciesClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: PoliciesClient):
        self._client = client

    def list_policies(
        self,
        *,
        customer_id: str = SENTINEL,
        status: PolicyStatus = SENTINEL,
        vin: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[PolicyList]:
        data = self._client.list_policies(
            **{
                k: v
                for k, v in {
                    "customer_id": customer_id,
                    "status": status,
                    "vin": vin,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def get_policy(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[PolicyDetail]:
        data = self._client.get_policy(policy_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncPoliciesClient(PoliciesClient):
    """
    Async wrapper for PoliciesClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawPoliciesClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawPoliciesClient(self)

    def list_policies(
        self,
        *,
        customer_id: str = SENTINEL,
        status: PolicyStatus = SENTINEL,
        vin: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[PolicyList]:
        return to_async(super().list_policies)(
            **{
                k: v
                for k, v in {
                    "customer_id": customer_id,
                    "status": status,
                    "vin": vin,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def get_policy(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[PolicyDetail]:
        return to_async(super().get_policy)(policy_id, request_config=request_config)


class AsyncRawPoliciesClient:
    """
    Async raw-response client for AsyncPoliciesClient.
    """

    def __init__(self, client: AsyncPoliciesClient):
        self._client = client

    async def list_policies(
        self,
        *,
        customer_id: str = SENTINEL,
        status: PolicyStatus = SENTINEL,
        vin: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[PolicyList]:
        data = await self._client.list_policies(
            **{
                k: v
                for k, v in {
                    "customer_id": customer_id,
                    "status": status,
                    "vin": vin,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def get_policy(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[PolicyDetail]:
        data = await self._client.get_policy(policy_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)
