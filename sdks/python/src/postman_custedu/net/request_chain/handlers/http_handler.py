import requests
import time

# Aliased rather than imported under its own name: `requests.exceptions.ConnectionError` would
# shadow the Python builtin of the same name for the whole module.
from requests.exceptions import ConnectionError as RequestsConnectionError, Timeout

# A dropped chunked body surfaces as ChunkedEncodingError rather than ConnectionError, so a
# premature end needs both; RequestException is the base a failed RECONNECT is caught on.
from requests.exceptions import (
    ChunkedEncodingError,
    RequestException as RequestsException,
)
from typing import Any, Generator, Optional, Tuple
from pydantic import TypeAdapter
from .base_handler import BaseHandler
from ...transport.request import Request
from ...transport.response import Response
from ...transport.api_error import ApiConnectionError, ApiError, ApiTimeoutError
from ....errors import subclass_for_code

#: Consecutive failed reconnects allowed between dispatched events. Not a lifetime cap -- the
#: counter resets whenever an event reaches the caller, so a long stream that drops occasionally is
#: not penalised for having been long.
DEFAULT_MAX_SSE_RECONNECT_ATTEMPTS = 5

#: Floor on the reconnect wait, including when the server advertises a shorter `retry:`. Without it
#: a server sending `retry: 0` would be reconnected to in a tight loop.
DEFAULT_SSE_RECONNECT_DELAY_SECONDS = 1.0

#: Ceiling on the server's `retry:`. A server advertising a multi-day interval would otherwise stall
#: the client for that long with no way for the caller to tell it apart from a hang.
MAX_SSE_RECONNECT_DELAY_SECONDS = 30.0


class HttpHandler(BaseHandler):
    """
    Handler for making HTTP requests.
    This handler sends the request to the specified URL and returns the response.

    :ivar int _timeout_in_seconds: The timeout for the HTTP request in seconds.
    """

    def __init__(self, timeout=60, http_client=None, follow_redirects=True):
        """
        Initialize a new instance of HttpHandler.

        :param http_client: An optional caller-supplied requests.Session used as-is (the SDK
            never reconfigures its transport). Falls back to the module-level `requests.request`
            when not provided.
        :param follow_redirects: Whether HTTP redirects (3xx responses) are followed
            automatically. `requests` follows them unconditionally otherwise, with no other way
            to opt out.
        """
        super().__init__()
        self._timeout_in_seconds = timeout
        self._http_client = http_client
        self._follow_redirects = follow_redirects

    def _request(self, method, url, **kwargs):
        """
        Dispatch a single HTTP request through the injected client, if any, otherwise through
        the module-level `requests.request`.
        """
        kwargs.setdefault("allow_redirects", self._follow_redirects)
        if self._http_client is not None:
            return self._http_client.request(method, url, **kwargs)
        return requests.request(method, url, **kwargs)

    def handle(
        self, request: Request
    ) -> Tuple[Optional[Response], Optional[Exception]]:
        """
        Send the request to the specified URL and return the response.

        :param Request request: The request to send.
        :return: The response and any error that occurred.
        :rtype: Tuple[Optional[Response], Optional[Exception]]
        """
        try:
            request_args = self._get_request_data(request)

            # Get timeout from config if available, otherwise use default
            timeout = self._get_timeout_from_config(request)

            result = self._request(
                request.method,
                request.url,
                headers=request.headers,
                timeout=timeout,
                **request_args,
            )
            response = Response(result)

            if response.status >= 400:
                # Raise Fern's status-named exception (FSM-275); an unmapped status falls back to
                # ApiError with a clear message (FSM-273). The body is the TYPED error model when the
                # endpoint declares one (FSM-853), falling back to the raw payload otherwise.
                error_class = subclass_for_code(response.status)
                error_body = response.body
                if response.status in request.errors and isinstance(
                    response.body, dict
                ):
                    error_model_class = request.errors[response.status]
                    try:
                        if isinstance(error_model_class, TypeAdapter):
                            error_body = error_model_class.validate_python(
                                response.body
                            )
                        else:
                            error_body = error_model_class(**response.body)
                    except Exception:
                        error_body = response.body
                if error_class is ApiError:
                    return None, ApiError(
                        message=f"Unexpected status code {response.status} from {request.url}",
                        status=response.status,
                        status_code=response.status,
                        headers=dict(response.headers),
                        body=error_body,
                    )
                return None, error_class(
                    body=error_body,
                    headers=dict(response.headers),
                )

            return response, None
        # FSDK-1585: a timeout is its own type, carrying no status. It used to be reported as
        # `ApiError("Request timed out", status=408)` — but nothing on the wire said 408, no
        # endpoint maps it, and no error class is named for it, so the failure was
        # indistinguishable by type from any other unmapped status. Dropping the synthetic status
        # is the fix, not a side effect of it.
        except Timeout as error:
            return None, ApiTimeoutError(f"Request timed out: {error}", cause=error)
        # FSDK-1573: a connection-level failure — refused, DNS, TLS — used to escape this handler
        # entirely, so a caller had to import `requests` to catch it and the SDK's abstraction
        # leaked its HTTP library. MUST stay below `except Timeout`: ConnectTimeout inherits from
        # both ConnectionError and Timeout, and a connect timeout is a timeout.
        except RequestsConnectionError as error:
            return None, ApiConnectionError(
                f"Connection to {request.url} failed: {error}", cause=error
            )

    def stream(
        self, request: Request
    ) -> Generator[Tuple[Optional[Response], Optional[Exception]], None, None]:
        """
        Stream the request to the specified URL and yield response chunks.
        Useful for handling large responses or server-sent events.

        :param request: The request to stream.
        :return: A generator yielding response chunks and any errors that occurred.
        """
        try:
            request_args = self._get_request_data(request)

            # Get timeout from config if available, otherwise use default
            timeout = self._get_timeout_from_config(request)

            result = self._request(
                request.method,
                request.url,
                headers=request.headers,
                timeout=timeout,
                stream=True,
                **request_args,
            )

            if result.status_code >= 400:
                response = Response(result)
                yield (
                    None,
                    ApiError(
                        message=f"{response.status} error in request to: {request.url}",
                        status=response.status,
                        response=response,
                    ),
                )

            else:
                content_type = result.headers.get("Content-Type", "").lower()
                if "text/event-stream" in content_type:
                    # Reconnection means the FIRST response may not be the only one, so the read
                    # loop owns opening later ones and is a method rather than inline: the retry
                    # loop and the frame loop at two indentation levels inside `stream()` was the
                    # version of this that hid a bug.
                    yield from self._stream_sse(request, request_args, timeout, result)
                else:
                    for chunk in result.iter_content(chunk_size=8192):
                        for response in Response.from_chunk(result, chunk):
                            yield response, None

        # FSDK-1585: the streaming path gets the same typed timeout as `handle`, so a caller does
        # not have to catch two different things depending on which method it called.
        except Timeout as error:
            yield None, ApiTimeoutError(f"Request timed out: {error}", cause=error)
        # Same ordering constraint as `handle`, for the same reason.
        except RequestsConnectionError as error:
            yield (
                None,
                ApiConnectionError(
                    f"Connection to {request.url} failed: {error}", cause=error
                ),
            )

    def _stream_sse(
        self,
        request: Request,
        request_args: dict,
        timeout: Any,
        result: "requests.Response",
    ) -> Generator[Tuple[Optional[Response], Optional[Exception]], None, None]:
        """
        Read an event stream, reconnecting from `Last-Event-ID` when one ends prematurely.

        The gating is deliberately in two parts, because the same failure has two correct outcomes.
        A stream that can NEVER reconnect must let the transport error escape, or a truncated
        response is indistinguishable from a complete one. A resumable stream that has merely run
        out of attempts, or that never dispatched an event to resume from, ends cleanly instead.

        :param request: The request being streamed.
        :param dict request_args: Body/params already prepared by the caller.
        :param timeout: The resolved request timeout.
        :param result: The response the caller already opened, read before any reconnect.
        :return: A generator yielding response chunks and any errors that occurred.
        """
        # Carried ACROSS attempts: the point of `Last-Event-ID` is that a resumed request continues
        # where the dropped one stopped, so none of this resets when a new response is opened.
        last_dispatched_id: Optional[str] = None
        last_retry_ms: Optional[int] = None
        reconnect_attempts = 0

        while True:
            buffer = b""
            terminated = False
            dropped: Optional[Exception] = None
            try:
                for chunk in result.iter_content(chunk_size=8192):
                    buffer += chunk
                    while True:
                        framed = Response.next_sse_frame(buffer)
                        if framed is None:
                            break
                        event_block, buffer = framed
                        # The terminal sentinel ends the stream: anything a server sends after it
                        # is not part of the response, so stop rather than merely skipping.
                        if Response.is_sse_terminal(
                            event_block, request.sse_terminator
                        ):
                            terminated = True
                            break
                        event_id, event_retry = Response.sse_frame_metadata(event_block)
                        for response in Response.from_chunk(result, event_block):
                            yield response, None
                        # Recorded AFTER dispatch: `Last-Event-ID` has to name an event the caller
                        # actually received, or the resume replays it.
                        if event_id is not None:
                            last_dispatched_id = event_id
                        if event_retry is not None:
                            last_retry_ms = event_retry
                        # Reset-on-progress. The budget bounds CONSECUTIVE failures between useful
                        # responses, not the stream's lifetime, so a server that emits an event and
                        # then drops -- forever -- reconnects forever. Browser `EventSource` does
                        # the same.
                        reconnect_attempts = 0
                    if terminated:
                        break
            except (ChunkedEncodingError, RequestsConnectionError) as error:
                # A premature end. It matters that this is distinguishable from a clean close:
                # only a clean close means the response is complete, and a drop leaves the trailing
                # buffer holding a torn frame that must NOT be dispatched.
                dropped = error

            if terminated or dropped is None:
                # A clean end. The trailing buffer can still hold a final frame that the server
                # closed without its blank line, which IS complete and is dispatched.
                if not terminated and buffer.strip():
                    for response in Response.from_chunk(result, buffer):
                        yield response, None
                return

            if not self._sse_reconnect_applicable(request):
                # Raised as the SDK's own connection error rather than re-raised raw. `stream`
                # already converts a transport failure this way (FSDK-1585) so a caller does not
                # have to catch two different things depending on which method they called, and a
                # `ChunkedEncodingError` is not a `ConnectionError`, so it would otherwise escape
                # the handler below untyped. Deliberately unlike Fern, which re-raises httpx's.
                raise ApiConnectionError(
                    f"Connection to {request.url} failed: {dropped}", cause=dropped
                )
            if not self._sse_should_reconnect(
                request, last_dispatched_id, reconnect_attempts
            ):
                return

            headers = dict(request.headers or {})
            # No `or ""` fallback: `_sse_should_reconnect` has already established that this is a
            # non-empty id. A fallback here would look harmless and would quietly resume from the
            # START of the stream if that gate ever loosened, replaying everything.
            headers["Last-Event-ID"] = last_dispatched_id

            # Re-opening is its own loop, so a failed or unusable attempt retries the OPEN rather
            # than falling through to the read. The first version set `result = None` and continued
            # the outer loop, which reached `result.iter_content` on the next pass and raised an
            # untyped `AttributeError` -- the invariant is that control never reaches the read with
            # no live response.
            reopened = None
            while True:
                if not self._sse_should_reconnect(
                    request, last_dispatched_id, reconnect_attempts
                ):
                    return
                reconnect_attempts += 1
                time.sleep(self._sse_reconnect_delay(last_retry_ms))
                try:
                    candidate = self._request(
                        request.method,
                        request.url,
                        headers=headers,
                        timeout=timeout,
                        stream=True,
                        **request_args,
                    )
                except RequestsException:
                    # A failed reconnect consumes an attempt rather than ending the stream, so a
                    # transient failure to re-open does not look like the stream completing.
                    continue
                if self._sse_reconnect_usable(candidate):
                    reopened = candidate
                    break
                # `requests` does not raise on a non-2xx, so a resume answering a 500 or an HTML
                # error page would be parsed as SSE and yield garbage. Released rather than
                # dropped: it was opened with `stream=True`, so discarding it holds a pooled
                # connection until GC, and the budget allows several of these in a row.
                candidate.close()
            result = reopened

    @staticmethod
    def _sse_reconnect_config(request: Request) -> dict:
        """The per-request reconnection settings, or an empty mapping when none were given."""
        return (request.config or {}).get("stream_reconnection") or {}

    def _sse_reconnect_applicable(self, request: Request) -> bool:
        """
        Whether this stream can EVER reconnect.

        Kept separate from :meth:`_sse_should_reconnect` so a mid-stream drop terminates correctly
        in both directions: a stream that can never reconnect re-raises, a resumable one that ran
        out of attempts ends cleanly.

        A declared terminator is required, and that is not incidental -- without one there is no way
        to tell a clean end from a drop, so reconnecting would re-request a stream that had already
        finished. Operations that declare `format: sse` and no terminator therefore never reconnect.
        """
        return (
            request.sse_resumable
            and request.sse_terminator is not None
            and self._sse_reconnect_config(request).get("enabled", True)
        )

    def _sse_should_reconnect(
        self,
        request: Request,
        last_dispatched_id: Optional[str],
        reconnect_attempts: int,
    ) -> bool:
        """
        Whether a prematurely-ended stream should be reconnected right now.

        A last DISPATCHED id is required: resuming with an empty `Last-Event-ID` asks the server to
        replay from the beginning, which duplicates every event the caller already handled.
        """
        if not self._sse_reconnect_applicable(request):
            return False
        if not last_dispatched_id:
            return False
        max_attempts = self._sse_reconnect_config(request).get(
            "attempts", DEFAULT_MAX_SSE_RECONNECT_ATTEMPTS
        )
        return reconnect_attempts < max_attempts

    def _sse_reconnect_delay(self, last_retry_ms: Optional[int]) -> float:
        """
        How long to wait before reconnecting, in seconds.

        The server's own `retry:` directive wins when it sent one, clamped at both ends: a floor so
        a server advertising 0 cannot be hammered, and a ceiling so one advertising a multi-day
        interval cannot stall the client indefinitely.
        """
        if last_retry_ms is None:
            return DEFAULT_SSE_RECONNECT_DELAY_SECONDS
        seconds = last_retry_ms / 1000.0
        return max(
            DEFAULT_SSE_RECONNECT_DELAY_SECONDS,
            min(seconds, MAX_SSE_RECONNECT_DELAY_SECONDS),
        )

    @staticmethod
    def _sse_reconnect_usable(result: "requests.Response") -> bool:
        """Whether a reconnected response can actually be resumed as an event stream."""
        return result.status_code < 400 and (
            "text/event-stream" in result.headers.get("Content-Type", "").lower()
        )

    def _get_request_data(self, request: Request) -> dict:
        """
        Get the request arguments based on the request headers and data.

        :param Request request: The request object.
        :return: The request arguments.
        :rtype: dict
        """
        headers = request.headers or {}
        additional_body_parameters = (request.config or {}).get(
            "additional_body_parameters"
        ) or {}

        # No body was set on the request (the operation declares no requestBody).
        # Sending an empty JSON payload would force a Content-Type the endpoint
        # never advertises, which strict servers reject with HTTP 415.
        if request.body is None:
            # Unless the caller asked for extra body keys: with nothing generated to merge into,
            # they ARE the body. Dropping them here would silently discard what was passed.
            if additional_body_parameters:
                return {"json": dict(additional_body_parameters)}
            return {}

        data = request.body or {}
        content_type = headers.get("Content-Type", "application/json")

        # Per-request `additional_body_parameters`, merged last so a caller key wins over a field
        # the SDK already serialized under the same wire name. Shallow and verbatim — the keys are
        # wire names, not python ones. An array or primitive body has no place to merge into, so it
        # goes out unchanged rather than being coerced into an object.
        if additional_body_parameters and isinstance(data, dict):
            data = {**data, **additional_body_parameters}

        if request.method == "GET" and not data:
            return {}

        # Raw binary bodies (e.g. application/octet-stream, file uploads) must be
        # sent as-is. Routing them through `json=` crashes with
        # "TypeError: Object of type bytes is not JSON serializable", regardless
        # of what Content-Type the request defaulted to.
        if isinstance(data, (bytes, bytearray)):
            return {"data": data}

        # The JSON family includes `text/json`, exactly as it does on the response side. This
        # tested `application/` only, so a declared `text/json` request body fell through to the
        # form-urlencoded branch below and went out as `data=payload` under a `text/json`
        # Content-Type — a body that matched neither its declared media type nor its schema
        # (FSDK-1571). Mirrors `isApplicationJson` in `src/generate/common/content-types.ts`.
        # `requests` only defaults the Content-Type header when one is not already set, so routing
        # through `json=` does not rewrite the declared `text/json`.
        if (
            content_type.startswith(("application/", "text/"))
            and "json" in content_type
        ):
            return {"json": data}

        if "multipart/form-data" in content_type:
            headers.pop("Content-Type", None)
            # `files` is a LIST of (field, part) pairs, not a dict: an array of files repeats one
            # field name, which a dict cannot hold. Collapsing it into `data` left `files` empty,
            # so requests form-urlencoded the whole body -- including the bytes (FSDK-1479).
            files, form_data = [], {}
            for key, value in data.items():
                if isinstance(value, (bytes, bytearray, memoryview)):
                    files.append((key, (key, value, "application/octet-stream")))
                elif self._is_file_array(value):
                    for item in value:
                        files.append((key, (key, item, "application/octet-stream")))
                else:
                    form_data[key] = value
            if not files and form_data:
                # requests only builds a multipart body when `files` is non-empty
                for key, value in form_data.items():
                    for item in value if isinstance(value, (list, tuple)) else [value]:
                        if item is not None:
                            files.append(
                                (
                                    key,
                                    (
                                        None,
                                        item
                                        if isinstance(item, (str, bytes))
                                        else str(item),
                                    ),
                                )
                            )
                form_data = {}
            return {"files": files, "data": form_data}

        return {"data": data}

    @staticmethod
    def _is_file_array(value) -> bool:
        """
        Whether a multipart field holds an array of files rather than form values.

        Requires EVERY element to be bytes-like: an array of primitives is a repeated form field,
        and requests already encodes a list value that way. The accepted types match the scalar
        file branch above, so a bytearray/memoryview of file content cannot fall through to form
        data.

        :param value: The value of a single multipart field.
        :return: True when the value is a non-empty sequence of bytes-like objects.
        :rtype: bool
        """
        return (
            isinstance(value, (list, tuple))
            and len(value) > 0
            and all(isinstance(item, (bytes, bytearray, memoryview)) for item in value)
        )

    def _get_timeout_from_config(self, request: Request) -> float:
        """
        Get the timeout for the request from config or use default.

        :param Request request: The request object.
        :return: The timeout in seconds.
        :rtype: float
        """
        if request.config and "timeout" in request.config:
            return request.config["timeout"]
        return self._timeout_in_seconds
