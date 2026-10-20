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
from ..models import Preferences, PreferencesContactMethod, Problem
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class PreferencesClient(BaseService):
    """
    Fern-style resource client for PreferencesClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._get_customer_preferences_config: SdkConfig = {}
        self._replace_customer_preferences_config: SdkConfig = {}

    def set_get_customer_preferences_config(self, config: SdkConfig):
        """
        Sets method-level configuration for get_customer_preferences.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._get_customer_preferences_config = config
        return self

    def set_replace_customer_preferences_config(self, config: SdkConfig):
        """
        Sets method-level configuration for replace_customer_preferences.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._replace_customer_preferences_config = config
        return self

    @property
    def with_raw_response(self) -> "RawPreferencesClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawPreferencesClient(self)

    @cast_models
    def get_customer_preferences(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Preferences:
        """get_customer_preferences

        :param customer_id: Unique customer ID.
        :type customer_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Preferences
        """

        Validator(str).validate(customer_id, "customer_id")

        resolved_config = self._get_resolved_config(
            self._get_customer_preferences_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/customers/v1/customers/{{customerId}}/preferences",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("customerId", customer_id)
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
                Preferences.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def replace_customer_preferences(
        self,
        customer_id: str,
        *,
        contact_method: PreferencesContactMethod = SENTINEL,
        language: str = SENTINEL,
        marketing_opt_in: bool = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Preferences:
        """replace_customer_preferences

        :param request_body: The request body.
        :type request_body: Preferences
        :param customer_id: Unique customer ID.
        :type customer_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Preferences
        """

        Validator(str).validate(customer_id, "customer_id")

        resolved_config = self._get_resolved_config(
            self._replace_customer_preferences_config, request_config
        )

        request_body = Preferences(
            **{
                k: v
                for k, v in {
                    "contact_method": contact_method,
                    "language": language,
                    "marketing_opt_in": marketing_opt_in,
                }.items()
                if v is not SENTINEL
            }
        )
        Validator(Preferences).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/customers/v1/customers/{{customerId}}/preferences",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("customerId", customer_id)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(404, Problem)
            .serialize()
            .set_method("PUT")
            .set_body(request_body)
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                Preferences.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawPreferencesClient:
    """
    Raw-response client for PreferencesClient.

    Each method delegates to the matching :class:`PreferencesClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: PreferencesClient):
        self._client = client

    def get_customer_preferences(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Preferences]:
        data = self._client.get_customer_preferences(
            customer_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def replace_customer_preferences(
        self,
        customer_id: str,
        *,
        contact_method: PreferencesContactMethod = SENTINEL,
        language: str = SENTINEL,
        marketing_opt_in: bool = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Preferences]:
        data = self._client.replace_customer_preferences(
            customer_id,
            **{
                k: v
                for k, v in {
                    "contact_method": contact_method,
                    "language": language,
                    "marketing_opt_in": marketing_opt_in,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncPreferencesClient(PreferencesClient):
    """
    Async wrapper for PreferencesClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawPreferencesClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawPreferencesClient(self)

    def get_customer_preferences(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[Preferences]:
        return to_async(super().get_customer_preferences)(
            customer_id, request_config=request_config
        )

    def replace_customer_preferences(
        self,
        customer_id: str,
        *,
        contact_method: PreferencesContactMethod = SENTINEL,
        language: str = SENTINEL,
        marketing_opt_in: bool = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Preferences]:
        return to_async(super().replace_customer_preferences)(
            customer_id,
            **{
                k: v
                for k, v in {
                    "contact_method": contact_method,
                    "language": language,
                    "marketing_opt_in": marketing_opt_in,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )


class AsyncRawPreferencesClient:
    """
    Async raw-response client for AsyncPreferencesClient.
    """

    def __init__(self, client: AsyncPreferencesClient):
        self._client = client

    async def get_customer_preferences(
        self, customer_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Preferences]:
        data = await self._client.get_customer_preferences(
            customer_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def replace_customer_preferences(
        self,
        customer_id: str,
        *,
        contact_method: PreferencesContactMethod = SENTINEL,
        language: str = SENTINEL,
        marketing_opt_in: bool = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Preferences]:
        data = await self._client.replace_customer_preferences(
            customer_id,
            **{
                k: v
                for k, v in {
                    "contact_method": contact_method,
                    "language": language,
                    "marketing_opt_in": marketing_opt_in,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
