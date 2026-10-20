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
    ListPaymentRefundsResponse,
    Money,
    Problem,
    Refund,
    RefundCreate,
    RefundCreateReason,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class RefundsClient(BaseService):
    """
    Fern-style resource client for RefundsClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_payment_refunds_config: SdkConfig = {}
        self._create_payment_refund_config: SdkConfig = {}

    def set_list_payment_refunds_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_payment_refunds.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_payment_refunds_config = config
        return self

    def set_create_payment_refund_config(self, config: SdkConfig):
        """
        Sets method-level configuration for create_payment_refund.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._create_payment_refund_config = config
        return self

    @property
    def with_raw_response(self) -> "RawRefundsClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawRefundsClient(self)

    @cast_models
    def list_payment_refunds(
        self, payment_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> ListPaymentRefundsResponse:
        """list_payment_refunds

        :param payment_id: Unique payment ID.
        :type payment_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ListPaymentRefundsResponse
        """

        Validator(str).validate(payment_id, "payment_id")

        resolved_config = self._get_resolved_config(
            self._list_payment_refunds_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/payments/v1/payments/{{paymentId}}/refunds",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("paymentId", payment_id)
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
                ListPaymentRefundsResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def create_payment_refund(
        self,
        payment_id: str,
        *,
        amount: Money,
        reason: RefundCreateReason,
        idempotency_key: str,
        request_config: Optional[SdkConfig] = None,
    ) -> Refund:
        """Only `completed` payments can be refunded, up to the amount not already refunded. The refund completes automatically after the settlement delay.

        :param request_body: The request body.
        :type request_body: RefundCreate
        :param payment_id: Unique payment ID.
        :type payment_id: str
        :param idempotency_key: Unique key (UUID recommended).
        :type idempotency_key: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Refund
        """

        Validator(str).validate(payment_id, "payment_id")
        Validator(str).validate(idempotency_key, "idempotency_key")

        resolved_config = self._get_resolved_config(
            self._create_payment_refund_config, request_config
        )

        request_body = RefundCreate(amount=amount, reason=reason)
        Validator(RefundCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/payments/v1/payments/{{paymentId}}/refunds",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_header("Idempotency-Key", idempotency_key)
            .add_path("paymentId", payment_id)
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
                Refund.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawRefundsClient:
    """
    Raw-response client for RefundsClient.

    Each method delegates to the matching :class:`RefundsClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: RefundsClient):
        self._client = client

    def list_payment_refunds(
        self, payment_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPaymentRefundsResponse]:
        data = self._client.list_payment_refunds(
            payment_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def create_payment_refund(
        self,
        payment_id: str,
        *,
        amount: Money,
        reason: RefundCreateReason,
        idempotency_key: str,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Refund]:
        data = self._client.create_payment_refund(
            payment_id,
            amount=amount,
            reason=reason,
            idempotency_key=idempotency_key,
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncRefundsClient(RefundsClient):
    """
    Async wrapper for RefundsClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawRefundsClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawRefundsClient(self)

    def list_payment_refunds(
        self, payment_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[ListPaymentRefundsResponse]:
        return to_async(super().list_payment_refunds)(
            payment_id, request_config=request_config
        )

    def create_payment_refund(
        self,
        payment_id: str,
        *,
        amount: Money,
        reason: RefundCreateReason,
        idempotency_key: str,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Refund]:
        return to_async(super().create_payment_refund)(
            payment_id,
            amount=amount,
            reason=reason,
            idempotency_key=idempotency_key,
            request_config=request_config,
        )


class AsyncRawRefundsClient:
    """
    Async raw-response client for AsyncRefundsClient.
    """

    def __init__(self, client: AsyncRefundsClient):
        self._client = client

    async def list_payment_refunds(
        self, payment_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPaymentRefundsResponse]:
        data = await self._client.list_payment_refunds(
            payment_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def create_payment_refund(
        self,
        payment_id: str,
        *,
        amount: Money,
        reason: RefundCreateReason,
        idempotency_key: str,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Refund]:
        data = await self._client.create_payment_refund(
            payment_id,
            amount=amount,
            reason=reason,
            idempotency_key=idempotency_key,
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
