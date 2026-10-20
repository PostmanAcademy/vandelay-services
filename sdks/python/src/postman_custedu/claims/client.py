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
    CancelRequest,
    CancelRequestReason,
    Claim,
    ClaimCreate,
    ClaimList,
    ClaimStatus,
    ClaimType,
    ClaimUpdate,
    Money,
    Problem,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class ClaimsClient(BaseService):
    """
    Fern-style resource client for ClaimsClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_claims_config: SdkConfig = {}
        self._create_claim_config: SdkConfig = {}
        self._get_claim_config: SdkConfig = {}
        self._update_claim_config: SdkConfig = {}
        self._cancel_claim_config: SdkConfig = {}

    def set_list_claims_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_claims.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_claims_config = config
        return self

    def set_create_claim_config(self, config: SdkConfig):
        """
        Sets method-level configuration for create_claim.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._create_claim_config = config
        return self

    def set_get_claim_config(self, config: SdkConfig):
        """
        Sets method-level configuration for get_claim.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._get_claim_config = config
        return self

    def set_update_claim_config(self, config: SdkConfig):
        """
        Sets method-level configuration for update_claim.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._update_claim_config = config
        return self

    def set_cancel_claim_config(self, config: SdkConfig):
        """
        Sets method-level configuration for cancel_claim.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._cancel_claim_config = config
        return self

    @property
    def with_raw_response(self) -> "RawClaimsClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawClaimsClient(self)

    @cast_models
    def list_claims(
        self,
        *,
        status: ClaimStatus = SENTINEL,
        customer_id: str = SENTINEL,
        policy_id: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> ClaimList:
        """Returns a paginated list of claims, newest first. Filter by status, customer, or policy.

        :param status: Filter by claim status., defaults to None
        :type status: ClaimStatus, optional
        :param customer_id: Filter by customer ID., defaults to None
        :type customer_id: str, optional
        :param policy_id: Filter by policy ID., defaults to None
        :type policy_id: str, optional
        :param limit: Maximum number of items to return., defaults to None
        :type limit: int, optional
        :param cursor: Opaque cursor from a previous response's `nextCursor`., defaults to None
        :type cursor: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ClaimList
        """

        Validator(ClaimStatus).is_optional().validate(status, "status")
        Validator(str).is_optional().validate(customer_id, "customer_id")
        Validator(str).is_optional().validate(policy_id, "policy_id")
        Validator(int).is_optional().validate(limit, "limit")
        Validator(str).is_optional().validate(cursor, "cursor")

        resolved_config = self._get_resolved_config(
            self._list_claims_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_query("status", status)
            .add_query("customerId", customer_id)
            .add_query("policyId", policy_id)
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
                ClaimList.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def create_claim(
        self,
        *,
        customer_id: str,
        policy_id: str,
        type: ClaimType,
        loss_date: str,
        description: str,
        vehicle_id: str = SENTINEL,
        loss_location: Address = SENTINEL,
        drivable: bool = SENTINEL,
        injuries: bool = SENTINEL,
        police_report_number: str = SENTINEL,
        submit: bool = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Claim:
        """Creates a new claim. The policy must be active on the loss date; coverage is validated against the Policy API. Set `submit` to `true` to move straight to `submitted`; otherwise the claim is created as a `draft`. The customer must be `active` and own the policy, and a `vehicleId` must be insured on it. The `deductible` comes from the coverage that pays for the loss type. A second claim for the same policy, vehicle, type, and loss date returns `409`.

        :param request_body: The request body.
        :type request_body: ClaimCreate
        :param idempotency_key: Unique key (UUID recommended) so retries do not create duplicate resources. Retrying with the same key and body returns the original response with `Idempotent-Replayed: true`; reusing a key with a different body is rejected., defaults to None
        :type idempotency_key: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Claim
        """

        Validator(str).is_optional().validate(idempotency_key, "idempotency_key")

        resolved_config = self._get_resolved_config(
            self._create_claim_config, request_config
        )

        request_body = ClaimCreate(
            customer_id=customer_id,
            policy_id=policy_id,
            type=type,
            loss_date=loss_date,
            description=description,
            **{
                k: v
                for k, v in {
                    "vehicle_id": vehicle_id,
                    "loss_location": loss_location,
                    "drivable": drivable,
                    "injuries": injuries,
                    "police_report_number": police_report_number,
                    "submit": submit,
                }.items()
                if v is not SENTINEL
            },
        )
        Validator(ClaimCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_header("Idempotency-Key", idempotency_key)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(409, Problem)
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
                Claim.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def get_claim(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Claim:
        """get_claim

        :param claim_id: Unique claim ID.
        :type claim_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Claim
        """

        Validator(str).validate(claim_id, "claim_id")

        resolved_config = self._get_resolved_config(
            self._get_claim_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims/{{claimId}}",
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
                Claim.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def update_claim(
        self,
        claim_id: str,
        *,
        status: ClaimStatus = SENTINEL,
        description: str = SENTINEL,
        assigned_adjuster_id: str = SENTINEL,
        estimated_amount: Money = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Claim:
        """Partially updates a claim. Only `draft`, `submitted`, and `under_review` claims can be modified. Status only moves forward (`draft` to `submitted` to `under_review` to `approved` or `denied`); an adjuster must be assigned before `under_review` and an estimate set before `approved`. Use `POST /claims/v1/claims/{claimId}/cancel` to cancel. The approved amount is the estimate less the deductible.

        :param request_body: The request body.
        :type request_body: ClaimUpdate
        :param claim_id: Unique claim ID.
        :type claim_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Claim
        """

        Validator(str).validate(claim_id, "claim_id")

        resolved_config = self._get_resolved_config(
            self._update_claim_config, request_config
        )

        request_body = ClaimUpdate(
            **{
                k: v
                for k, v in {
                    "status": status,
                    "description": description,
                    "assigned_adjuster_id": assigned_adjuster_id,
                    "estimated_amount": estimated_amount,
                }.items()
                if v is not SENTINEL
            }
        )
        Validator(ClaimUpdate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims/{{claimId}}",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("claimId", claim_id)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(404, Problem)
            .add_error(409, Problem)
            .serialize()
            .set_method("PATCH")
            .set_body(request_body)
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                Claim.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def cancel_claim(
        self,
        claim_id: str,
        *,
        reason: CancelRequestReason,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Claim:
        """Cancels a claim that has not yet been settled. Open vendor assignments and any payments still `pending_approval` or `processing` are cancelled with it.

        :param request_body: The request body.
        :type request_body: CancelRequest
        :param claim_id: Unique claim ID.
        :type claim_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Claim
        """

        Validator(str).validate(claim_id, "claim_id")

        resolved_config = self._get_resolved_config(
            self._cancel_claim_config, request_config
        )

        request_body = CancelRequest(
            reason=reason,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
        )
        Validator(CancelRequest).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims/{{claimId}}/cancel",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("claimId", claim_id)
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
                Claim.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawClaimsClient:
    """
    Raw-response client for ClaimsClient.

    Each method delegates to the matching :class:`ClaimsClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: ClaimsClient):
        self._client = client

    def list_claims(
        self,
        *,
        status: ClaimStatus = SENTINEL,
        customer_id: str = SENTINEL,
        policy_id: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[ClaimList]:
        data = self._client.list_claims(
            **{
                k: v
                for k, v in {
                    "status": status,
                    "customer_id": customer_id,
                    "policy_id": policy_id,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def create_claim(
        self,
        *,
        customer_id: str,
        policy_id: str,
        type: ClaimType,
        loss_date: str,
        description: str,
        vehicle_id: str = SENTINEL,
        loss_location: Address = SENTINEL,
        drivable: bool = SENTINEL,
        injuries: bool = SENTINEL,
        police_report_number: str = SENTINEL,
        submit: bool = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Claim]:
        data = self._client.create_claim(
            customer_id=customer_id,
            policy_id=policy_id,
            type=type,
            loss_date=loss_date,
            description=description,
            **{
                k: v
                for k, v in {
                    "vehicle_id": vehicle_id,
                    "loss_location": loss_location,
                    "drivable": drivable,
                    "injuries": injuries,
                    "police_report_number": police_report_number,
                    "submit": submit,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def get_claim(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Claim]:
        data = self._client.get_claim(claim_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)

    def update_claim(
        self,
        claim_id: str,
        *,
        status: ClaimStatus = SENTINEL,
        description: str = SENTINEL,
        assigned_adjuster_id: str = SENTINEL,
        estimated_amount: Money = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Claim]:
        data = self._client.update_claim(
            claim_id,
            **{
                k: v
                for k, v in {
                    "status": status,
                    "description": description,
                    "assigned_adjuster_id": assigned_adjuster_id,
                    "estimated_amount": estimated_amount,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def cancel_claim(
        self,
        claim_id: str,
        *,
        reason: CancelRequestReason,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Claim]:
        data = self._client.cancel_claim(
            claim_id,
            reason=reason,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncClaimsClient(ClaimsClient):
    """
    Async wrapper for ClaimsClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawClaimsClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawClaimsClient(self)

    def list_claims(
        self,
        *,
        status: ClaimStatus = SENTINEL,
        customer_id: str = SENTINEL,
        policy_id: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[ClaimList]:
        return to_async(super().list_claims)(
            **{
                k: v
                for k, v in {
                    "status": status,
                    "customer_id": customer_id,
                    "policy_id": policy_id,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def create_claim(
        self,
        *,
        customer_id: str,
        policy_id: str,
        type: ClaimType,
        loss_date: str,
        description: str,
        vehicle_id: str = SENTINEL,
        loss_location: Address = SENTINEL,
        drivable: bool = SENTINEL,
        injuries: bool = SENTINEL,
        police_report_number: str = SENTINEL,
        submit: bool = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Claim]:
        return to_async(super().create_claim)(
            customer_id=customer_id,
            policy_id=policy_id,
            type=type,
            loss_date=loss_date,
            description=description,
            **{
                k: v
                for k, v in {
                    "vehicle_id": vehicle_id,
                    "loss_location": loss_location,
                    "drivable": drivable,
                    "injuries": injuries,
                    "police_report_number": police_report_number,
                    "submit": submit,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def get_claim(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[Claim]:
        return to_async(super().get_claim)(claim_id, request_config=request_config)

    def update_claim(
        self,
        claim_id: str,
        *,
        status: ClaimStatus = SENTINEL,
        description: str = SENTINEL,
        assigned_adjuster_id: str = SENTINEL,
        estimated_amount: Money = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Claim]:
        return to_async(super().update_claim)(
            claim_id,
            **{
                k: v
                for k, v in {
                    "status": status,
                    "description": description,
                    "assigned_adjuster_id": assigned_adjuster_id,
                    "estimated_amount": estimated_amount,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def cancel_claim(
        self,
        claim_id: str,
        *,
        reason: CancelRequestReason,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Claim]:
        return to_async(super().cancel_claim)(
            claim_id,
            reason=reason,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
            request_config=request_config,
        )


class AsyncRawClaimsClient:
    """
    Async raw-response client for AsyncClaimsClient.
    """

    def __init__(self, client: AsyncClaimsClient):
        self._client = client

    async def list_claims(
        self,
        *,
        status: ClaimStatus = SENTINEL,
        customer_id: str = SENTINEL,
        policy_id: str = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[ClaimList]:
        data = await self._client.list_claims(
            **{
                k: v
                for k, v in {
                    "status": status,
                    "customer_id": customer_id,
                    "policy_id": policy_id,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def create_claim(
        self,
        *,
        customer_id: str,
        policy_id: str,
        type: ClaimType,
        loss_date: str,
        description: str,
        vehicle_id: str = SENTINEL,
        loss_location: Address = SENTINEL,
        drivable: bool = SENTINEL,
        injuries: bool = SENTINEL,
        police_report_number: str = SENTINEL,
        submit: bool = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Claim]:
        data = await self._client.create_claim(
            customer_id=customer_id,
            policy_id=policy_id,
            type=type,
            loss_date=loss_date,
            description=description,
            **{
                k: v
                for k, v in {
                    "vehicle_id": vehicle_id,
                    "loss_location": loss_location,
                    "drivable": drivable,
                    "injuries": injuries,
                    "police_report_number": police_report_number,
                    "submit": submit,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def get_claim(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Claim]:
        data = await self._client.get_claim(claim_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)

    async def update_claim(
        self,
        claim_id: str,
        *,
        status: ClaimStatus = SENTINEL,
        description: str = SENTINEL,
        assigned_adjuster_id: str = SENTINEL,
        estimated_amount: Money = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Claim]:
        data = await self._client.update_claim(
            claim_id,
            **{
                k: v
                for k, v in {
                    "status": status,
                    "description": description,
                    "assigned_adjuster_id": assigned_adjuster_id,
                    "estimated_amount": estimated_amount,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def cancel_claim(
        self,
        claim_id: str,
        *,
        reason: CancelRequestReason,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Claim]:
        data = await self._client.cancel_claim(
            claim_id,
            reason=reason,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
