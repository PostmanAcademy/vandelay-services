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
    ListWorkOrdersResponse,
    Money,
    Problem,
    VendorType,
    WorkOrder,
    WorkOrderCreate,
    WorkOrderStatus,
    WorkOrderUpdate,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class WorkOrdersClient(BaseService):
    """
    Fern-style resource client for WorkOrdersClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_work_orders_config: SdkConfig = {}
        self._create_work_order_config: SdkConfig = {}
        self._get_work_order_config: SdkConfig = {}
        self._update_work_order_config: SdkConfig = {}

    def set_list_work_orders_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_work_orders.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_work_orders_config = config
        return self

    def set_create_work_order_config(self, config: SdkConfig):
        """
        Sets method-level configuration for create_work_order.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._create_work_order_config = config
        return self

    def set_get_work_order_config(self, config: SdkConfig):
        """
        Sets method-level configuration for get_work_order.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._get_work_order_config = config
        return self

    def set_update_work_order_config(self, config: SdkConfig):
        """
        Sets method-level configuration for update_work_order.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._update_work_order_config = config
        return self

    @property
    def with_raw_response(self) -> "RawWorkOrdersClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawWorkOrdersClient(self)

    @cast_models
    def list_work_orders(
        self,
        *,
        vendor_id: str = SENTINEL,
        claim_id: str = SENTINEL,
        status: WorkOrderStatus = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> ListWorkOrdersResponse:
        """list_work_orders

        :param vendor_id: Filter by vendor., defaults to None
        :type vendor_id: str, optional
        :param claim_id: Filter by claim., defaults to None
        :type claim_id: str, optional
        :param status: Filter by status., defaults to None
        :type status: WorkOrderStatus, optional
        :param limit: Maximum number of items to return., defaults to None
        :type limit: int, optional
        :param cursor: Opaque cursor from a previous response's `nextCursor`., defaults to None
        :type cursor: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ListWorkOrdersResponse
        """

        Validator(str).is_optional().validate(vendor_id, "vendor_id")
        Validator(str).is_optional().validate(claim_id, "claim_id")
        Validator(WorkOrderStatus).is_optional().validate(status, "status")
        Validator(int).is_optional().validate(limit, "limit")
        Validator(str).is_optional().validate(cursor, "cursor")

        resolved_config = self._get_resolved_config(
            self._list_work_orders_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/vendors/v1/work-orders",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_query("vendorId", vendor_id)
            .add_query("claimId", claim_id)
            .add_query("status", status)
            .add_query("limit", limit)
            .add_query("cursor", cursor)
            .add_error(401, Problem)
            .serialize()
            .set_method("GET")
        )

        response, status, content = self.send_request(serialized_request)
        return (
            None
            if response in (b"", "")
            else (
                ListWorkOrdersResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def create_work_order(
        self,
        *,
        claim_id: str,
        vendor_id: str,
        type: VendorType,
        scheduled_for: str = SENTINEL,
        instructions: str = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> WorkOrder:
        """Issues a work order to a vendor for a claim. The vendor must be `active` and serve the loss location. The same engagement appears in the Claims API as an assignment.

        :param request_body: The request body.
        :type request_body: WorkOrderCreate
        :param idempotency_key: Unique key (UUID recommended) so retries do not create duplicate resources. Retrying with the same key and body returns the original response with `Idempotent-Replayed: true`; reusing a key with a different body is rejected., defaults to None
        :type idempotency_key: str, optional
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: WorkOrder
        """

        Validator(str).is_optional().validate(idempotency_key, "idempotency_key")

        resolved_config = self._get_resolved_config(
            self._create_work_order_config, request_config
        )

        request_body = WorkOrderCreate(
            claim_id=claim_id,
            vendor_id=vendor_id,
            type=type,
            **{
                k: v
                for k, v in {
                    "scheduled_for": scheduled_for,
                    "instructions": instructions,
                }.items()
                if v is not SENTINEL
            },
        )
        Validator(WorkOrderCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/vendors/v1/work-orders",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_header("Idempotency-Key", idempotency_key)
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
                WorkOrder.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def get_work_order(
        self, work_order_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> WorkOrder:
        """get_work_order

        :param work_order_id: Unique work order ID.
        :type work_order_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: WorkOrder
        """

        Validator(str).validate(work_order_id, "work_order_id")

        resolved_config = self._get_resolved_config(
            self._get_work_order_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/vendors/v1/work-orders/{{workOrderId}}",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("workOrderId", work_order_id)
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
                WorkOrder.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def update_work_order(
        self,
        work_order_id: str,
        *,
        status: WorkOrderStatus = SENTINEL,
        estimate: Money = SENTINEL,
        scheduled_for: str = SENTINEL,
        notes: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> WorkOrder:
        """Vendors use this endpoint to accept, schedule, submit estimates, and complete work. Status moves `issued` to `accepted` to `in_progress` to `completed` (or `declined` or `cancelled`), and an estimate can be submitted once the work order is accepted.

        :param request_body: The request body.
        :type request_body: WorkOrderUpdate
        :param work_order_id: Unique work order ID.
        :type work_order_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: WorkOrder
        """

        Validator(str).validate(work_order_id, "work_order_id")

        resolved_config = self._get_resolved_config(
            self._update_work_order_config, request_config
        )

        request_body = WorkOrderUpdate(
            **{
                k: v
                for k, v in {
                    "status": status,
                    "estimate": estimate,
                    "scheduled_for": scheduled_for,
                    "notes": notes,
                }.items()
                if v is not SENTINEL
            }
        )
        Validator(WorkOrderUpdate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/vendors/v1/work-orders/{{workOrderId}}",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("workOrderId", work_order_id)
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
                WorkOrder.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawWorkOrdersClient:
    """
    Raw-response client for WorkOrdersClient.

    Each method delegates to the matching :class:`WorkOrdersClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: WorkOrdersClient):
        self._client = client

    def list_work_orders(
        self,
        *,
        vendor_id: str = SENTINEL,
        claim_id: str = SENTINEL,
        status: WorkOrderStatus = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[ListWorkOrdersResponse]:
        data = self._client.list_work_orders(
            **{
                k: v
                for k, v in {
                    "vendor_id": vendor_id,
                    "claim_id": claim_id,
                    "status": status,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def create_work_order(
        self,
        *,
        claim_id: str,
        vendor_id: str,
        type: VendorType,
        scheduled_for: str = SENTINEL,
        instructions: str = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[WorkOrder]:
        data = self._client.create_work_order(
            claim_id=claim_id,
            vendor_id=vendor_id,
            type=type,
            **{
                k: v
                for k, v in {
                    "scheduled_for": scheduled_for,
                    "instructions": instructions,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    def get_work_order(
        self, work_order_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[WorkOrder]:
        data = self._client.get_work_order(work_order_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)

    def update_work_order(
        self,
        work_order_id: str,
        *,
        status: WorkOrderStatus = SENTINEL,
        estimate: Money = SENTINEL,
        scheduled_for: str = SENTINEL,
        notes: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[WorkOrder]:
        data = self._client.update_work_order(
            work_order_id,
            **{
                k: v
                for k, v in {
                    "status": status,
                    "estimate": estimate,
                    "scheduled_for": scheduled_for,
                    "notes": notes,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncWorkOrdersClient(WorkOrdersClient):
    """
    Async wrapper for WorkOrdersClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawWorkOrdersClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawWorkOrdersClient(self)

    def list_work_orders(
        self,
        *,
        vendor_id: str = SENTINEL,
        claim_id: str = SENTINEL,
        status: WorkOrderStatus = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[ListWorkOrdersResponse]:
        return to_async(super().list_work_orders)(
            **{
                k: v
                for k, v in {
                    "vendor_id": vendor_id,
                    "claim_id": claim_id,
                    "status": status,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def create_work_order(
        self,
        *,
        claim_id: str,
        vendor_id: str,
        type: VendorType,
        scheduled_for: str = SENTINEL,
        instructions: str = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[WorkOrder]:
        return to_async(super().create_work_order)(
            claim_id=claim_id,
            vendor_id=vendor_id,
            type=type,
            **{
                k: v
                for k, v in {
                    "scheduled_for": scheduled_for,
                    "instructions": instructions,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )

    def get_work_order(
        self, work_order_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[WorkOrder]:
        return to_async(super().get_work_order)(
            work_order_id, request_config=request_config
        )

    def update_work_order(
        self,
        work_order_id: str,
        *,
        status: WorkOrderStatus = SENTINEL,
        estimate: Money = SENTINEL,
        scheduled_for: str = SENTINEL,
        notes: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[WorkOrder]:
        return to_async(super().update_work_order)(
            work_order_id,
            **{
                k: v
                for k, v in {
                    "status": status,
                    "estimate": estimate,
                    "scheduled_for": scheduled_for,
                    "notes": notes,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )


class AsyncRawWorkOrdersClient:
    """
    Async raw-response client for AsyncWorkOrdersClient.
    """

    def __init__(self, client: AsyncWorkOrdersClient):
        self._client = client

    async def list_work_orders(
        self,
        *,
        vendor_id: str = SENTINEL,
        claim_id: str = SENTINEL,
        status: WorkOrderStatus = SENTINEL,
        limit: int = SENTINEL,
        cursor: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[ListWorkOrdersResponse]:
        data = await self._client.list_work_orders(
            **{
                k: v
                for k, v in {
                    "vendor_id": vendor_id,
                    "claim_id": claim_id,
                    "status": status,
                    "limit": limit,
                    "cursor": cursor,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def create_work_order(
        self,
        *,
        claim_id: str,
        vendor_id: str,
        type: VendorType,
        scheduled_for: str = SENTINEL,
        instructions: str = SENTINEL,
        idempotency_key: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[WorkOrder]:
        data = await self._client.create_work_order(
            claim_id=claim_id,
            vendor_id=vendor_id,
            type=type,
            **{
                k: v
                for k, v in {
                    "scheduled_for": scheduled_for,
                    "instructions": instructions,
                    "idempotency_key": idempotency_key,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def get_work_order(
        self, work_order_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[WorkOrder]:
        data = await self._client.get_work_order(
            work_order_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def update_work_order(
        self,
        work_order_id: str,
        *,
        status: WorkOrderStatus = SENTINEL,
        estimate: Money = SENTINEL,
        scheduled_for: str = SENTINEL,
        notes: str = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[WorkOrder]:
        data = await self._client.update_work_order(
            work_order_id,
            **{
                k: v
                for k, v in {
                    "status": status,
                    "estimate": estimate,
                    "scheduled_for": scheduled_for,
                    "notes": notes,
                }.items()
                if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
