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
    ListClaimNotesResponse,
    Note,
    NoteCreate,
    NoteCreateVisibility,
    Problem,
)
from ..services.async_.utils.to_async import to_async
from typing import Awaitable


class NotesClient(BaseService):
    """
    Fern-style resource client for NotesClient.
    Exposes this resource's endpoints and, when the resource has sub-resources, lazy
    accessors to its child clients (`client.<parent>.<child>.method(...)`).
    Inherits authentication, base-url and request handling from BaseService.
    """

    def __init__(self, *args, **kwargs):
        """Initialize the resource client, its child clients and method-level configs."""
        super().__init__(*args, **kwargs)
        self._list_claim_notes_config: SdkConfig = {}
        self._add_claim_note_config: SdkConfig = {}

    def set_list_claim_notes_config(self, config: SdkConfig):
        """
        Sets method-level configuration for list_claim_notes.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._list_claim_notes_config = config
        return self

    def set_add_claim_note_config(self, config: SdkConfig):
        """
        Sets method-level configuration for add_claim_note.

        :param SdkConfig config: Configuration dictionary to override service-level defaults.
        :return: The service instance for method chaining.
        """
        self._add_claim_note_config = config
        return self

    @property
    def with_raw_response(self) -> "RawNotesClient":
        """
        Returns a raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of
        the bare deserialized body.
        """
        return RawNotesClient(self)

    @cast_models
    def list_claim_notes(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> ListClaimNotesResponse:
        """list_claim_notes

        :param claim_id: Unique claim ID.
        :type claim_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: ListClaimNotesResponse
        """

        Validator(str).validate(claim_id, "claim_id")

        resolved_config = self._get_resolved_config(
            self._list_claim_notes_config, request_config
        )

        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims/{{claimId}}/notes",
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
                ListClaimNotesResponse.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )

    @cast_models
    def add_claim_note(
        self,
        claim_id: str,
        *,
        body: str,
        visibility: NoteCreateVisibility = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Note:
        """add_claim_note

        :param request_body: The request body.
        :type request_body: NoteCreate
        :param claim_id: Unique claim ID.
        :type claim_id: str
        ...
        :raises RequestError: Raised when a request fails, with optional HTTP status code and details.
        ...
        :return: The parsed response data.
        :rtype: Note
        """

        Validator(str).validate(claim_id, "claim_id")

        resolved_config = self._get_resolved_config(
            self._add_claim_note_config, request_config
        )

        request_body = NoteCreate(
            body=body,
            **{
                k: v for k, v in {"visibility": visibility}.items() if v is not SENTINEL
            },
        )
        Validator(NoteCreate).validate(request_body, "request_body")
        serialized_request = (
            Serializer(
                f"{self._resolve_base_url(resolved_config) or PostmanCusteduApiEnvironment.DEFAULT.url}/claims/v1/claims/{{claimId}}/notes",
                [self.get_access_token(resolved_config)],
                resolved_config,
            )
            .add_path("claimId", claim_id)
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
                Note.model_validate(response)
                if should_validate_response(resolved_config)
                else response
            )
        )


class RawNotesClient:
    """
    Raw-response client for NotesClient.

    Each method delegates to the matching :class:`NotesClient` method and wraps the result in
    an ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and
    ``.headers``.
    """

    def __init__(self, client: NotesClient):
        self._client = client

    def list_claim_notes(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListClaimNotesResponse]:
        data = self._client.list_claim_notes(claim_id, request_config=request_config)
        return HttpResponse(data=data, response=self._client._last_response)

    def add_claim_note(
        self,
        claim_id: str,
        *,
        body: str,
        visibility: NoteCreateVisibility = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Note]:
        data = self._client.add_claim_note(
            claim_id,
            body=body,
            **{
                k: v for k, v in {"visibility": visibility}.items() if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)


class AsyncNotesClient(NotesClient):
    """
    Async wrapper for NotesClient. Mirrors the sync client's endpoints (awaitable) and, for a
    resource with sub-resources, its lazy child accessors (returning the async child clients).
    """

    @property
    def with_raw_response(self) -> "AsyncRawNotesClient":
        """
        Returns an async raw-response client whose methods mirror this resource but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawNotesClient(self)

    def list_claim_notes(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> Awaitable[ListClaimNotesResponse]:
        return to_async(super().list_claim_notes)(
            claim_id, request_config=request_config
        )

    def add_claim_note(
        self,
        claim_id: str,
        *,
        body: str,
        visibility: NoteCreateVisibility = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> Awaitable[Note]:
        return to_async(super().add_claim_note)(
            claim_id,
            body=body,
            **{
                k: v for k, v in {"visibility": visibility}.items() if v is not SENTINEL
            },
            request_config=request_config,
        )


class AsyncRawNotesClient:
    """
    Async raw-response client for AsyncNotesClient.
    """

    def __init__(self, client: AsyncNotesClient):
        self._client = client

    async def list_claim_notes(
        self, claim_id: str, *, request_config: Optional[SdkConfig] = None
    ) -> HttpResponse[ListClaimNotesResponse]:
        data = await self._client.list_claim_notes(
            claim_id, request_config=request_config
        )
        return HttpResponse(data=data, response=self._client._last_response)

    async def add_claim_note(
        self,
        claim_id: str,
        *,
        body: str,
        visibility: NoteCreateVisibility = SENTINEL,
        request_config: Optional[SdkConfig] = None,
    ) -> HttpResponse[Note]:
        data = await self._client.add_claim_note(
            claim_id,
            body=body,
            **{
                k: v for k, v in {"visibility": visibility}.items() if v is not SENTINEL
            },
            request_config=request_config,
        )
        return HttpResponse(data=data, response=self._client._last_response)
