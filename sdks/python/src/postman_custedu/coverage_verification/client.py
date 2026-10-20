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
    CoverageVerification,
    CoverageVerificationRequest,
    CoverageVerificationRequestClaimType,
    Problem,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class CoverageVerificationClient(BaseService):
    """
    Fern-style resource client for CoverageVerificationClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._verify_coverage_config: SdkConfig = {}

    def set_verify_coverage_config(self, config: SdkConfig):
        """
        Sets method-level configuration for verify_coverage.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._verify_coverage_config = config
        return self

    @property
    def with_raw_response(self) -> "RawCoverageVerificationClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawCoverageVerificationClient(self)

    @cast_models
    def verify_coverage(
        self,
        policy_id: str,
        *,
        loss_date: str,
        claim_type: CoverageVerificationRequestClaimType,
        vehicle_id: str = SENTINEL,
        driver_id: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> CoverageVerification:
        """Checks whether the policy and vehicle were covered on the loss date for the given claim type, and returns applicable coverage, limit, and deductible. A policy that is not covered returns `200` with `covered: false` and a `reasons` list. Use `404` only when the policy does not exist.

        :param request_body: The request body.
        :type request_body: CoverageVerificationRequest
        :param policy_id: Unique policy ID.
        :type policy_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: CoverageVerification
        """

        Validator(str).validate(policy_id, "policy_id")

        resolved_config = self._get_resolved_config(
            self._verify_coverage_config, request_config
        )

        request_body = CoverageVerificationRequest(
            loss_date=loss_date,
            claim_type=claim_type,
            **{
                k: v
                for k, v in {"vehicle_id": vehicle_id, "driver_id": driver_id}.items()
                if v is not SENTINEL
            },
        )
        Validator(CoverageVerificationRequest).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/policies/v1/policies/{{policyId}}/coverage-verifications",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("policyId", policy_id)
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
                CoverageVerification.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawCoverageVerificationClient:
    """
    Raw-response client for CoverageVerificationClient.

    Each method delegates to the matching :class:`CoverageVerificationClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: CoverageVerificationClient):
        self._client = client

    def verify_coverage(
        self,
        policy_id: str,
        *,
        loss_date: str,
        claim_type: CoverageVerificationRequestClaimType,
        vehicle_id: str = SENTINEL,
        driver_id: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[CoverageVerification]:
        data = self._client.verify_coverage(
            policy_id,
            loss_date=loss_date,
            claim_type=claim_type,
            **{
                k: v
                for k, v in {"vehicle_id": vehicle_id, "driver_id": driver_id}.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncCoverageVerificationClient(CoverageVerificationClient):
    """
    Async wrapper for CoverageVerificationClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawCoverageVerificationClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawCoverageVerificationClient(self)

    def verify_coverage(
        self,
        policy_id: str,
        *,
        loss_date: str,
        claim_type: CoverageVerificationRequestClaimType,
        vehicle_id: str = SENTINEL,
        driver_id: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[CoverageVerification]:
        return to_async(super().verify_coverage)(
            policy_id,
            loss_date=loss_date,
            claim_type=claim_type,
            **{
                k: v
                for k, v in {"vehicle_id": vehicle_id, "driver_id": driver_id}.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )


class AsyncRawCoverageVerificationClient:
    """
    Async raw-response client for AsyncCoverageVerificationClient.
    """

    def __init__(self, client: AsyncCoverageVerificationClient):
        self._client = client

    async def verify_coverage(
        self,
        policy_id: str,
        *,
        loss_date: str,
        claim_type: CoverageVerificationRequestClaimType,
        vehicle_id: str = SENTINEL,
        driver_id: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[CoverageVerification]:
        data = await self._client.verify_coverage(
            policy_id,
            loss_date=loss_date,
            claim_type=claim_type,
            **{
                k: v
                for k, v in {"vehicle_id": vehicle_id, "driver_id": driver_id}.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
