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
    ListPaymentMethodsResponse,
    PaymentMethod,
    PaymentMethodCreate,
    PaymentMethodCreateType,
    Problem,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class PaymentMethodsClient(BaseService):
    """
    Fern-style resource client for PaymentMethodsClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_payment_methods_config: SdkConfig = {}
        self._create_payment_method_config: SdkConfig = {}

    def set_list_payment_methods_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_payment_methods.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_payment_methods_config = config
        return self

    def set_create_payment_method_config(self, config: SdkConfig):
        """
        Sets method-level configuration for create_payment_method.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._create_payment_method_config = config
        return self

    @property
    def with_raw_response(self) -> "RawPaymentMethodsClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawPaymentMethodsClient(self)

    @cast_models
    def list_payment_methods(
        self, *, payee_id: str, request_config: Optional[SdkConfig] = None
    ) -> ListPaymentMethodsResponse:
        """Returns tokenized payout destinations for a payee. Account numbers are never returned; only the last four digits.

        :param payee_id: Customer or vendor ID.
        :type payee_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ListPaymentMethodsResponse
        """

        Validator(str).validate(payee_id, "payee_id")

        resolved_config = self._get_resolved_config(
            self._list_payment_methods_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/payments/v1/payment-methods",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_query("payeeId", payee_id)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .serialize()
            .set_method("GET")
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                ListPaymentMethodsResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def create_payment_method(
        self,
        *,
        payee_id: str,
        type: PaymentMethodCreateType,
        token: str,
        is_default: bool = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> PaymentMethod:
        """Registers a payout destination using a single-use `token` created by the Vandelay hosted payment form. Raw account numbers are never accepted.

        :param request_body: The request body.
        :type request_body: PaymentMethodCreate
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: PaymentMethod
        """

        resolved_config = self._get_resolved_config(
            self._create_payment_method_config, request_config
        )

        request_body = PaymentMethodCreate(
            payee_id=payee_id,
            type=type,
            token=token,
            **{
                k: v for k, v in {"is_default": is_default}.items() if v is not SENTINEL
            },
        )
        Validator(PaymentMethodCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/payments/v1/payment-methods",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_error(400, Problem)
            .add_error(401, Problem)
            .serialize()
            .set_method("POST")
            .set_body(request_body)
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                PaymentMethod.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawPaymentMethodsClient:
    """
    Raw-response client for PaymentMethodsClient.

    Each method delegates to the matching :class:`PaymentMethodsClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: PaymentMethodsClient):
        self._client = client

    def list_payment_methods(
        self, *, payee_id: str, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPaymentMethodsResponse]:
        data = self._client.list_payment_methods(
            payee_id=payee_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def create_payment_method(
        self,
        *,
        payee_id: str,
        type: PaymentMethodCreateType,
        token: str,
        is_default: bool = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[PaymentMethod]:
        data = self._client.create_payment_method(
            payee_id=payee_id,
            type=type,
            token=token,
            **{
                k: v for k, v in {"is_default": is_default}.items() if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncPaymentMethodsClient(PaymentMethodsClient):
    """
    Async wrapper for PaymentMethodsClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawPaymentMethodsClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawPaymentMethodsClient(self)

    def list_payment_methods(
        self, *, payee_id: str, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[ListPaymentMethodsResponse]:
        return to_async(super().list_payment_methods)(
            payee_id=payee_id, request_config=request_config
        )

    def create_payment_method(
        self,
        *,
        payee_id: str,
        type: PaymentMethodCreateType,
        token: str,
        is_default: bool = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[PaymentMethod]:
        return to_async(super().create_payment_method)(
            payee_id=payee_id,
            type=type,
            token=token,
            **{
                k: v for k, v in {"is_default": is_default}.items() if v is not SENTINEL
            },
            request_config=request_config,
        )


class AsyncRawPaymentMethodsClient:
    """
    Async raw-response client for AsyncPaymentMethodsClient.
    """

    def __init__(self, client: AsyncPaymentMethodsClient):
        self._client = client

    async def list_payment_methods(
        self, *, payee_id: str, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListPaymentMethodsResponse]:
        data = await self._client.list_payment_methods(
            payee_id=payee_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def create_payment_method(
        self,
        *,
        payee_id: str,
        type: PaymentMethodCreateType,
        token: str,
        is_default: bool = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[PaymentMethod]:
        data = await self._client.create_payment_method(
            payee_id=payee_id,
            type=type,
            token=token,
            **{
                k: v for k, v in {"is_default": is_default}.items() if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
