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
    ApprovePaymentRequest,
    CancelPaymentRequest,
    CancelPaymentRequestReason,
    Money,
    Payee,
    Payment,
    PaymentCreate,
    PaymentCreateType,
    PaymentList,
    PaymentStatus,
    Problem,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class PaymentsClient(BaseService):
    """
    Fern-style resource client for PaymentsClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_payments_config: SdkConfig = {}
        self._create_payment_config: SdkConfig = {}
        self._get_payment_config: SdkConfig = {}
        self._approve_payment_config: SdkConfig = {}
        self._cancel_payment_config: SdkConfig = {}

    def set_list_payments_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_payments.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_payments_config = config
        return self

    def set_create_payment_config(self, config: SdkConfig):
        """
        Sets method-level configuration for create_payment.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._create_payment_config = config
        return self

    def set_get_payment_config(self, config: SdkConfig):
        """
        Sets method-level configuration for get_payment.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._get_payment_config = config
        return self

    def set_approve_payment_config(self, config: SdkConfig):
        """
        Sets method-level configuration for approve_payment.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._approve_payment_config = config
        return self

    def set_cancel_payment_config(self, config: SdkConfig):
        """
        Sets method-level configuration for cancel_payment.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._cancel_payment_config = config
        return self

    @property
    def with_raw_response(self) -> "RawPaymentsClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawPaymentsClient(self)

    @cast_models
    def list_payments(
        self,
        *,
        claim_id: str = SENTINEL,
        payee_id: str = SENTINEL,
        status: PaymentStatus = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> PaymentList:
        """list_payments

        :param claim_id: Filter by claim., defaults to None
        :type claim_id: str, optional
        :param payee_id: Filter by payee (customer or vendor ID)., defaults to None
        :type payee_id: str, optional
        :param status: Filter by status., defaults to None
        :type status: PaymentStatus, optional
        :param limit: Maximum number of items to return., defaults to None
        :type limit: int, optional
        :param cursor: Opaque cursor from a previous response's `nextCursor`., defaults to None
        :type cursor: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: PaymentList
        """

        Validator(str).is_optional().validate(claim_id, "claim_id")
        Validator(str).is_optional().validate(payee_id, "payee_id")
        Validator(PaymentStatus).is_optional().validate(status, "status")
        Validator(int).is_optional().validate(limit, "limit")
        Validator(str).is_optional().validate(cursor, "cursor")

        resolved_config = self._get_resolved_config(
            self._list_payments_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/payments/v1/payments",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_query("claimId", claim_id)
            .add_query("payeeId", payee_id)
            .add_query("status", status)
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
                PaymentList.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def create_payment(
        self,
        *,
        claim_id: str,
        type: PaymentCreateType,
        payee: Payee,
        payment_method_id: str,
        amount: Money,
        idempotency_key: str,
        invoice_number: str = SENTINEL,
        memo: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Payment:
        """Creates a payment for an approved claim. The amount cannot exceed the claim's remaining approved balance (the estimate less the deductible, minus payments already made and refunded). Requires the `payments:write` scope. Payments over the approval threshold start in `pending_approval`; all others start in `processing`.

        :param request_body: The request body.
        :type request_body: PaymentCreate
        :param idempotency_key: Unique key (UUID recommended). Retrying with the same key and body returns the original payment with `Idempotent-Replayed: true`; reusing the key with a different body returns `409`.
        :type idempotency_key: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Payment
        """

        Validator(str).validate(idempotency_key, "idempotency_key")

        resolved_config = self._get_resolved_config(
            self._create_payment_config, request_config
        )

        request_body = PaymentCreate(
            claim_id=claim_id,
            type=type,
            payee=payee,
            payment_method_id=payment_method_id,
            amount=amount,
            **{
                k: v
                for k, v in {"invoice_number": invoice_number, "memo": memo}.items()
                if v is not SENTINEL
            },
        )
        Validator(PaymentCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/payments/v1/payments",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_header("Idempotency-Key", idempotency_key)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(403, Problem)
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
                Payment.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def get_payment(
        self, payment_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Payment:
        """get_payment

        :param payment_id: Unique payment ID.
        :type payment_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Payment
        """

        Validator(str).validate(payment_id, "payment_id")

        resolved_config = self._get_resolved_config(
            self._get_payment_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/payments/v1/payments/{{paymentId}}",
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
                Payment.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def approve_payment(
        self,
        payment_id: str,
        *,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Payment:
        """Requires the `payments:approve` scope. The approver must differ from the creator.

        :param request_body: The request body., defaults to None
        :type request_body: ApprovePaymentRequest, optional
        :param payment_id: Unique payment ID.
        :type payment_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Payment
        """

        Validator(str).validate(payment_id, "payment_id")

        resolved_config = self._get_resolved_config(
            self._approve_payment_config, request_config
        )

        request_body = ApprovePaymentRequest(
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL}
        )
        Validator(ApprovePaymentRequest).is_optional().validate(
            request_body, "request_body"
        )
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/payments/v1/payments/{{paymentId}}/approve",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("paymentId", payment_id)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(403, Problem)
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
                Payment.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def cancel_payment(
        self,
        payment_id: str,
        *,
        reason: CancelPaymentRequestReason,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Payment:
        """Only payments in `pending_approval` or `processing` (before bank submission) can be cancelled.

        :param request_body: The request body.
        :type request_body: CancelPaymentRequest
        :param payment_id: Unique payment ID.
        :type payment_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Payment
        """

        Validator(str).validate(payment_id, "payment_id")

        resolved_config = self._get_resolved_config(
            self._cancel_payment_config, request_config
        )

        request_body = CancelPaymentRequest(
            reason=reason,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
        )
        Validator(CancelPaymentRequest).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/payments/v1/payments/{{paymentId}}/cancel",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("paymentId", payment_id)
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
                Payment.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawPaymentsClient:
    """
    Raw-response client for PaymentsClient.

    Each method delegates to the matching :class:`PaymentsClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: PaymentsClient):
        self._client = client

    def list_payments(
        self,
        *,
        claim_id: str = SENTINEL,
        payee_id: str = SENTINEL,
        status: PaymentStatus = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[PaymentList]:
        data = self._client.list_payments(
            **{
                k: v
                for k, v in {
                    "claim_id": claim_id,
                    "payee_id": payee_id,
                    "status": status,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def create_payment(
        self,
        *,
        claim_id: str,
        type: PaymentCreateType,
        payee: Payee,
        payment_method_id: str,
        amount: Money,
        idempotency_key: str,
        invoice_number: str = SENTINEL,
        memo: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Payment]:
        data = self._client.create_payment(
            claim_id=claim_id,
            type=type,
            payee=payee,
            payment_method_id=payment_method_id,
            amount=amount,
            idempotency_key=idempotency_key,
            **{
                k: v
                for k, v in {"invoice_number": invoice_number, "memo": memo}.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def get_payment(
        self, payment_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Payment]:
        data = self._client.get_payment(payment_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)

    def approve_payment(
        self,
        payment_id: str,
        *,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Payment]:
        data = self._client.approve_payment(
            payment_id,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def cancel_payment(
        self,
        payment_id: str,
        *,
        reason: CancelPaymentRequestReason,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Payment]:
        data = self._client.cancel_payment(
            payment_id,
            reason=reason,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncPaymentsClient(PaymentsClient):
    """
    Async wrapper for PaymentsClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawPaymentsClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawPaymentsClient(self)

    def list_payments(
        self,
        *,
        claim_id: str = SENTINEL,
        payee_id: str = SENTINEL,
        status: PaymentStatus = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[PaymentList]:
        return to_async(super().list_payments)(
            **{
                k: v
                for k, v in {
                    "claim_id": claim_id,
                    "payee_id": payee_id,
                    "status": status,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def create_payment(
        self,
        *,
        claim_id: str,
        type: PaymentCreateType,
        payee: Payee,
        payment_method_id: str,
        amount: Money,
        idempotency_key: str,
        invoice_number: str = SENTINEL,
        memo: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Payment]:
        return to_async(super().create_payment)(
            claim_id=claim_id,
            type=type,
            payee=payee,
            payment_method_id=payment_method_id,
            amount=amount,
            idempotency_key=idempotency_key,
            **{
                k: v
                for k, v in {"invoice_number": invoice_number, "memo": memo}.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def get_payment(
        self, payment_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[Payment]:
        return to_async(super().get_payment)(payment_id, request_config=request_config)

    def approve_payment(
        self,
        payment_id: str,
        *,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Payment]:
        return to_async(super().approve_payment)(
            payment_id,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
            request_config=request_config,
        )

    def cancel_payment(
        self,
        payment_id: str,
        *,
        reason: CancelPaymentRequestReason,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Payment]:
        return to_async(super().cancel_payment)(
            payment_id,
            reason=reason,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
            request_config=request_config,
        )


class AsyncRawPaymentsClient:
    """
    Async raw-response client for AsyncPaymentsClient.
    """

    def __init__(self, client: AsyncPaymentsClient):
        self._client = client

    async def list_payments(
        self,
        *,
        claim_id: str = SENTINEL,
        payee_id: str = SENTINEL,
        status: PaymentStatus = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[PaymentList]:
        data = await self._client.list_payments(
            **{
                k: v
                for k, v in {
                    "claim_id": claim_id,
                    "payee_id": payee_id,
                    "status": status,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def create_payment(
        self,
        *,
        claim_id: str,
        type: PaymentCreateType,
        payee: Payee,
        payment_method_id: str,
        amount: Money,
        idempotency_key: str,
        invoice_number: str = SENTINEL,
        memo: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Payment]:
        data = await self._client.create_payment(
            claim_id=claim_id,
            type=type,
            payee=payee,
            payment_method_id=payment_method_id,
            amount=amount,
            idempotency_key=idempotency_key,
            **{
                k: v
                for k, v in {"invoice_number": invoice_number, "memo": memo}.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def get_payment(
        self, payment_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Payment]:
        data = await self._client.get_payment(payment_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)

    async def approve_payment(
        self,
        payment_id: str,
        *,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Payment]:
        data = await self._client.approve_payment(
            payment_id,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def cancel_payment(
        self,
        payment_id: str,
        *,
        reason: CancelPaymentRequestReason,
        comment: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Payment]:
        data = await self._client.cancel_payment(
            payment_id,
            reason=reason,
            **{k: v for k, v in {"comment": comment}.items() if v is not SENTINEL},
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
