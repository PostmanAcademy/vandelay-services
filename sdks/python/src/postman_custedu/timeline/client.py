from typing import Any, Optional, Union
from ..services.utils.validator import Validator
from ..services.utils.base_service import BaseService
from ..net.transport.serializer import Serializer
from ..net.transport.http_response import HttpResponse
from ..net.sdk_config import should_validate_response
from ..net.sdk_config import SdkConfig
from ..net.environment.environment import PostmanCusteduApiEnvironment
from ..models.utils.cast_models import cast_models
from ..models import GetClaimTimelineResponse, Problem
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class TimelineClient(BaseService):
    """
    Fern-style resource client for TimelineClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._get_claim_timeline_config: SdkConfig = {}

    def set_get_claim_timeline_config(self, config: SdkConfig):
        """
        Sets method-level configuration for get_claim_timeline.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._get_claim_timeline_config = config
        return self

    @property
    def with_raw_response(self) -> "RawTimelineClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawTimelineClient(self)

    @cast_models
    def get_claim_timeline(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> GetClaimTimelineResponse:
        """Chronological audit trail of events for the claim.

        :param claim_id: Unique claim ID.
        :type claim_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: GetClaimTimelineResponse
        """

        Validator(str).validate(claim_id, "claim_id")

        resolved_config = self._get_resolved_config(
            self._get_claim_timeline_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims/{{claimId}}/timeline",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("claimId", claim_id)
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
                GetClaimTimelineResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawTimelineClient:
    """
    Raw-response client for TimelineClient.

    Each method delegates to the matching :class:`TimelineClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: TimelineClient):
        self._client = client

    def get_claim_timeline(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[GetClaimTimelineResponse]:
        data = self._client.get_claim_timeline(claim_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncTimelineClient(TimelineClient):
    """
    Async wrapper for TimelineClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawTimelineClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawTimelineClient(self)

    def get_claim_timeline(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[GetClaimTimelineResponse]:
        return to_async(super().get_claim_timeline)(
            claim_id, request_config=request_config
        )


class AsyncRawTimelineClient:
    """
    Async raw-response client for AsyncTimelineClient.
    """

    def __init__(self, client: AsyncTimelineClient):
        self._client = client

    async def get_claim_timeline(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[GetClaimTimelineResponse]:
        data = await self._client.get_claim_timeline(
            claim_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)
