from typing import Any, Optional, List, Union
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
    Problem,
    Vendor,
    VendorCreate,
    VendorList,
    VendorType,
    VendorUpdate,
    VendorUpdateStatus,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class VendorsClient(BaseService):
    """
    Fern-style resource client for VendorsClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_vendors_config: SdkConfig = {}
        self._create_vendor_config: SdkConfig = {}
        self._get_vendor_config: SdkConfig = {}
        self._update_vendor_config: SdkConfig = {}

    def set_list_vendors_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_vendors.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_vendors_config = config
        return self

    def set_create_vendor_config(self, config: SdkConfig):
        """
        Sets method-level configuration for create_vendor.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._create_vendor_config = config
        return self

    def set_get_vendor_config(self, config: SdkConfig):
        """
        Sets method-level configuration for get_vendor.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._get_vendor_config = config
        return self

    def set_update_vendor_config(self, config: SdkConfig):
        """
        Sets method-level configuration for update_vendor.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._update_vendor_config = config
        return self

    @property
    def with_raw_response(self) -> "RawVendorsClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawVendorsClient(self)

    @cast_models
    def list_vendors(
        self,
        *,
        type: VendorType = SENTINEL,
        postal_code: str = SENTINEL,
        radius_miles: int = SENTINEL,
        in_network: bool = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> VendorList:
        """Find vendors by service type and proximity. Results are sorted by distance when `postalCode` is supplied.

        :param type: Vendor service type., defaults to None
        :type type: VendorType, optional
        :param postal_code: Center the search on this postal code., defaults to None
        :type postal_code: str, optional
        :param radius_miles: Search radius in miles (requires `postalCode`)., defaults to None
        :type radius_miles: int, optional
        :param in_network: Only return preferred-network vendors., defaults to None
        :type in_network: bool, optional
        :param limit: Maximum number of items to return., defaults to None
        :type limit: int, optional
        :param cursor: Opaque cursor from a previous response's `nextCursor`., defaults to None
        :type cursor: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: VendorList
        """

        Validator(VendorType).is_optional().validate(type, "type")
        Validator(str).is_optional().validate(postal_code, "postal_code")
        Validator(int).is_optional().validate(radius_miles, "radius_miles")
        Validator(bool).is_optional().validate(in_network, "in_network")
        Validator(int).is_optional().validate(limit, "limit")
        Validator(str).is_optional().validate(cursor, "cursor")

        resolved_config = self._get_resolved_config(
            self._list_vendors_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/vendors/v1/vendors",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_query("type", type)
            .add_query("postalCode", postal_code)
            .add_query("radiusMiles", radius_miles)
            .add_query("inNetwork", in_network)
            .add_query("limit", limit)
            .add_query("cursor", cursor)
            .add_error(400, Problem)
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
                VendorList.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def create_vendor(
        self,
        *,
        name: str,
        type: VendorType,
        phone: str,
        email: str,
        address: Address,
        tax_id: str = SENTINEL,
        service_area_postal_codes: List[str] = SENTINEL,
        in_network: bool = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Vendor:
        """create_vendor

        :param request_body: The request body.
        :type request_body: VendorCreate
        :param idempotency_key: Unique key (UUID recommended) so retries do not create duplicate resources. Retrying with the same key and body returns the original response with `Idempotent-Replayed: true`; reusing a key with a different body is rejected., defaults to None
        :type idempotency_key: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Vendor
        """

        Validator(str).is_optional().validate(idempotency_key, "idempotency_key")

        resolved_config = self._get_resolved_config(
            self._create_vendor_config, request_config
        )

        request_body = VendorCreate(
            name=name,
            type=type,
            phone=phone,
            email=email,
            address=address,
            **{
                k: v
                for k, v in {
                    "tax_id": tax_id,
                    "service_area_postal_codes": service_area_postal_codes,
                    "in_network": in_network,
                }.items()
                if v is not SENTINEL
            },
        )
        Validator(VendorCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/vendors/v1/vendors",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_header("Idempotency-Key", idempotency_key)
            .add_error(400, Problem)
            .add_error(401, Problem)
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
                Vendor.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def get_vendor(
        self, vendor_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Vendor:
        """get_vendor

        :param vendor_id: Unique vendor ID.
        :type vendor_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Vendor
        """

        Validator(str).validate(vendor_id, "vendor_id")

        resolved_config = self._get_resolved_config(
            self._get_vendor_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/vendors/v1/vendors/{{vendorId}}",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("vendorId", vendor_id)
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
                Vendor.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def update_vendor(
        self,
        vendor_id: str,
        *,
        name: str = SENTINEL,
        phone: str = SENTINEL,
        email: str = SENTINEL,
        in_network: bool = SENTINEL,
        status: VendorUpdateStatus = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Vendor:
        """Suspending or terminating a vendor also removes it from the preferred network (`inNetwork` becomes `false`).

        :param request_body: The request body.
        :type request_body: VendorUpdate
        :param vendor_id: Unique vendor ID.
        :type vendor_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Vendor
        """

        Validator(str).validate(vendor_id, "vendor_id")

        resolved_config = self._get_resolved_config(
            self._update_vendor_config, request_config
        )

        request_body = VendorUpdate(
            **{
                k: v
                for k, v in {
                    "name": name,
                    "phone": phone,
                    "email": email,
                    "in_network": in_network,
                    "status": status,
                }.items()
                if v is not SENTINEL
            }
        )
        Validator(VendorUpdate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/vendors/v1/vendors/{{vendorId}}",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("vendorId", vendor_id)
            .add_error(400, Problem)
            .add_error(401, Problem)
            .add_error(404, Problem)
            .serialize()
            .set_method("PATCH")
            .set_body(request_body)
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                Vendor.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawVendorsClient:
    """
    Raw-response client for VendorsClient.

    Each method delegates to the matching :class:`VendorsClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: VendorsClient):
        self._client = client

    def list_vendors(
        self,
        *,
        type: VendorType = SENTINEL,
        postal_code: str = SENTINEL,
        radius_miles: int = SENTINEL,
        in_network: bool = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[VendorList]:
        data = self._client.list_vendors(
            **{
                k: v
                for k, v in {
                    "type": type,
                    "postal_code": postal_code,
                    "radius_miles": radius_miles,
                    "in_network": in_network,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def create_vendor(
        self,
        *,
        name: str,
        type: VendorType,
        phone: str,
        email: str,
        address: Address,
        tax_id: str = SENTINEL,
        service_area_postal_codes: List[str] = SENTINEL,
        in_network: bool = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Vendor]:
        data = self._client.create_vendor(
            name=name,
            type=type,
            phone=phone,
            email=email,
            address=address,
            **{
                k: v
                for k, v in {
                    "tax_id": tax_id,
                    "service_area_postal_codes": service_area_postal_codes,
                    "in_network": in_network,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def get_vendor(
        self, vendor_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Vendor]:
        data = self._client.get_vendor(vendor_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)

    def update_vendor(
        self,
        vendor_id: str,
        *,
        name: str = SENTINEL,
        phone: str = SENTINEL,
        email: str = SENTINEL,
        in_network: bool = SENTINEL,
        status: VendorUpdateStatus = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Vendor]:
        data = self._client.update_vendor(
            vendor_id,
            **{
                k: v
                for k, v in {
                    "name": name,
                    "phone": phone,
                    "email": email,
                    "in_network": in_network,
                    "status": status,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncVendorsClient(VendorsClient):
    """
    Async wrapper for VendorsClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawVendorsClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawVendorsClient(self)

    def list_vendors(
        self,
        *,
        type: VendorType = SENTINEL,
        postal_code: str = SENTINEL,
        radius_miles: int = SENTINEL,
        in_network: bool = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[VendorList]:
        return to_async(super().list_vendors)(
            **{
                k: v
                for k, v in {
                    "type": type,
                    "postal_code": postal_code,
                    "radius_miles": radius_miles,
                    "in_network": in_network,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def create_vendor(
        self,
        *,
        name: str,
        type: VendorType,
        phone: str,
        email: str,
        address: Address,
        tax_id: str = SENTINEL,
        service_area_postal_codes: List[str] = SENTINEL,
        in_network: bool = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Vendor]:
        return to_async(super().create_vendor)(
            name=name,
            type=type,
            phone=phone,
            email=email,
            address=address,
            **{
                k: v
                for k, v in {
                    "tax_id": tax_id,
                    "service_area_postal_codes": service_area_postal_codes,
                    "in_network": in_network,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def get_vendor(
        self, vendor_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[Vendor]:
        return to_async(super().get_vendor)(vendor_id, request_config=request_config)

    def update_vendor(
        self,
        vendor_id: str,
        *,
        name: str = SENTINEL,
        phone: str = SENTINEL,
        email: str = SENTINEL,
        in_network: bool = SENTINEL,
        status: VendorUpdateStatus = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Vendor]:
        return to_async(super().update_vendor)(
            vendor_id,
            **{
                k: v
                for k, v in {
                    "name": name,
                    "phone": phone,
                    "email": email,
                    "in_network": in_network,
                    "status": status,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )


class AsyncRawVendorsClient:
    """
    Async raw-response client for AsyncVendorsClient.
    """

    def __init__(self, client: AsyncVendorsClient):
        self._client = client

    async def list_vendors(
        self,
        *,
        type: VendorType = SENTINEL,
        postal_code: str = SENTINEL,
        radius_miles: int = SENTINEL,
        in_network: bool = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[VendorList]:
        data = await self._client.list_vendors(
            **{
                k: v
                for k, v in {
                    "type": type,
                    "postal_code": postal_code,
                    "radius_miles": radius_miles,
                    "in_network": in_network,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def create_vendor(
        self,
        *,
        name: str,
        type: VendorType,
        phone: str,
        email: str,
        address: Address,
        tax_id: str = SENTINEL,
        service_area_postal_codes: List[str] = SENTINEL,
        in_network: bool = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Vendor]:
        data = await self._client.create_vendor(
            name=name,
            type=type,
            phone=phone,
            email=email,
            address=address,
            **{
                k: v
                for k, v in {
                    "tax_id": tax_id,
                    "service_area_postal_codes": service_area_postal_codes,
                    "in_network": in_network,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def get_vendor(
        self, vendor_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[Vendor]:
        data = await self._client.get_vendor(vendor_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)

    async def update_vendor(
        self,
        vendor_id: str,
        *,
        name: str = SENTINEL,
        phone: str = SENTINEL,
        email: str = SENTINEL,
        in_network: bool = SENTINEL,
        status: VendorUpdateStatus = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Vendor]:
        data = await self._client.update_vendor(
            vendor_id,
            **{
                k: v
                for k, v in {
                    "name": name,
                    "phone": phone,
                    "email": email,
                    "in_network": in_network,
                    "status": status,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
