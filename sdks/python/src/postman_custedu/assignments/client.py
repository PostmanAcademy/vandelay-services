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
    Assignment,
    AssignmentCreate,
    AssignmentCreateRole,
    ListClaimAssignmentsResponse,
    Problem,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class AssignmentsClient(BaseService):
    """
    Fern-style resource client for AssignmentsClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_claim_assignments_config: SdkConfig = {}
        self._assign_vendor_to_claim_config: SdkConfig = {}

    def set_list_claim_assignments_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_claim_assignments.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_claim_assignments_config = config
        return self

    def set_assign_vendor_to_claim_config(self, config: SdkConfig):
        """
        Sets method-level configuration for assign_vendor_to_claim.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._assign_vendor_to_claim_config = config
        return self

    @property
    def with_raw_response(self) -> "RawAssignmentsClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawAssignmentsClient(self)

    @cast_models
    def list_claim_assignments(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> ListClaimAssignmentsResponse:
        """list_claim_assignments

        :param claim_id: Unique claim ID.
        :type claim_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ListClaimAssignmentsResponse
        """

        Validator(str).validate(claim_id, "claim_id")

        resolved_config = self._get_resolved_config(
            self._list_claim_assignments_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims/{{claimId}}/assignments",
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
                ListClaimAssignmentsResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def assign_vendor_to_claim(
        self,
        claim_id: str,
        *,
        vendor_id: str,
        role: AssignmentCreateRole,
        scheduled_for: str = SENTINEL,
        instructions: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Assignment:
        """Requests a vendor (from the Vendors API) to perform work on the claim.

        :param request_body: The request body.
        :type request_body: AssignmentCreate
        :param claim_id: Unique claim ID.
        :type claim_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Assignment
        """

        Validator(str).validate(claim_id, "claim_id")

        resolved_config = self._get_resolved_config(
            self._assign_vendor_to_claim_config, request_config
        )

        request_body = AssignmentCreate(
            vendor_id=vendor_id,
            role=role,
            **{
                k: v
                for k, v in {
                    "scheduled_for": scheduled_for,
                    "instructions": instructions,
                }.items()
                if v is not SENTINEL
            },
        )
        Validator(AssignmentCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims/{{claimId}}/assignments",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("claimId", claim_id)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(404, Problem)
            .add_error(422, Problem)
            .serialize()
            .set_method("POST")
            .set_body(request_body)
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                Assignment.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawAssignmentsClient:
    """
    Raw-response client for AssignmentsClient.

    Each method delegates to the matching :class:`AssignmentsClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: AssignmentsClient):
        self._client = client

    def list_claim_assignments(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListClaimAssignmentsResponse]:
        data = self._client.list_claim_assignments(
            claim_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def assign_vendor_to_claim(
        self,
        claim_id: str,
        *,
        vendor_id: str,
        role: AssignmentCreateRole,
        scheduled_for: str = SENTINEL,
        instructions: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Assignment]:
        data = self._client.assign_vendor_to_claim(
            claim_id,
            vendor_id=vendor_id,
            role=role,
            **{
                k: v
                for k, v in {
                    "scheduled_for": scheduled_for,
                    "instructions": instructions,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncAssignmentsClient(AssignmentsClient):
    """
    Async wrapper for AssignmentsClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawAssignmentsClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawAssignmentsClient(self)

    def list_claim_assignments(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[ListClaimAssignmentsResponse]:
        return to_async(super().list_claim_assignments)(
            claim_id, request_config=request_config
        )

    def assign_vendor_to_claim(
        self,
        claim_id: str,
        *,
        vendor_id: str,
        role: AssignmentCreateRole,
        scheduled_for: str = SENTINEL,
        instructions: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Assignment]:
        return to_async(super().assign_vendor_to_claim)(
            claim_id,
            vendor_id=vendor_id,
            role=role,
            **{
                k: v
                for k, v in {
                    "scheduled_for": scheduled_for,
                    "instructions": instructions,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )


class AsyncRawAssignmentsClient:
    """
    Async raw-response client for AsyncAssignmentsClient.
    """

    def __init__(self, client: AsyncAssignmentsClient):
        self._client = client

    async def list_claim_assignments(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListClaimAssignmentsResponse]:
        data = await self._client.list_claim_assignments(
            claim_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def assign_vendor_to_claim(
        self,
        claim_id: str,
        *,
        vendor_id: str,
        role: AssignmentCreateRole,
        scheduled_for: str = SENTINEL,
        instructions: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Assignment]:
        data = await self._client.assign_vendor_to_claim(
            claim_id,
            vendor_id=vendor_id,
            role=role,
            **{
                k: v
                for k, v in {
                    "scheduled_for": scheduled_for,
                    "instructions": instructions,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
