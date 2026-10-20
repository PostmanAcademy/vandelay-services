from typing import Any, Optional, Union
from ..services.utils.validator import Validator
from ..services.utils.base_service import BaseService
from ..net.transport.serializer import Serializer
from ..net.transport.http_response import HttpResponse
from ..net.sdk_config import should_validate_response
from ..net.sdk_config import SdkConfig
from ..net.environment.environment import PostmanCusteduApiEnvironment
from ..models.utils.cast_models import cast_models
from ..models import ListPolicyCoveragesResponse, Problem
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class CoveragesClient(BaseService):
    """
    Fern-style resource client for CoveragesClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_policy_coverages_config: SdkConfig = {}

    def set_list_policy_coverages_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_policy_coverages.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_policy_coverages_config = config
        return self

    @property
    def with_raw_response(self) -> "RawCoveragesClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawCoveragesClient(self)

    @cast_models
    def list_policy_coverages(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> ListPolicyCoveragesResponse:
        """list_policy_coverages

        :param policy_id: Unique policy ID.
        :type policy_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ListPolicyCoveragesResponse
        """

        Validator(str).validate(policy_id, "policy_id")

        resolved_config = self._get_resolved_config(
            self._list_policy_coverages_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/policies/v1/policies/{{policyId}}/coverages",
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
                ListPolicyCoveragesResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawCoveragesClient:
    """
    Raw-response client for CoveragesClient.

    Each method delegates to the matching :class:`CoveragesClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: CoveragesClient):
        self._client = client

    def list_policy_coverages(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPolicyCoveragesResponse]:
        data = self._client.list_policy_coverages(
            policy_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncCoveragesClient(CoveragesClient):
    """
    Async wrapper for CoveragesClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawCoveragesClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawCoveragesClient(self)

    def list_policy_coverages(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[ListPolicyCoveragesResponse]:
        return to_async(super().list_policy_coverages)(
            policy_id, request_config=request_config
        )


class AsyncRawCoveragesClient:
    """
    Async raw-response client for AsyncCoveragesClient.
    """

    def __init__(self, client: AsyncCoveragesClient):
        self._client = client

    async def list_policy_coverages(
        self, policy_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPolicyCoveragesResponse]:
        data = await self._client.list_policy_coverages(
            policy_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)
