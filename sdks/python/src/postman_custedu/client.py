import warnings
import requests
import logging
from typing import Callable, Optional, Optional, TYPE_CHECKING, Union
from .net.environment import PostmanCusteduApiEnvironment
from .services.utils.base_service import BaseService
from .net.sdk_config import SdkConfig
from typing import Awaitable

if TYPE_CHECKING:
    from .customers.client import CustomersClient, AsyncCustomersClient
    from .vehicles.client import VehiclesClient, AsyncVehiclesClient
    from .preferences.client import PreferencesClient, AsyncPreferencesClient
    from .policies.client import PoliciesClient, AsyncPoliciesClient
    from .coverages.client import CoveragesClient, AsyncCoveragesClient
    from .drivers.client import DriversClient, AsyncDriversClient
    from .coverage_verification.client import (
        CoverageVerificationClient,
        AsyncCoverageVerificationClient,
    )
    from .claims.client import ClaimsClient, AsyncClaimsClient
    from .notes.client import NotesClient, AsyncNotesClient
    from .assignments.client import AssignmentsClient, AsyncAssignmentsClient
    from .timeline.client import TimelineClient, AsyncTimelineClient
    from .payments.client import PaymentsClient, AsyncPaymentsClient
    from .refunds.client import RefundsClient, AsyncRefundsClient
    from .payment_methods.client import PaymentMethodsClient, AsyncPaymentMethodsClient
    from .vendors.client import VendorsClient, AsyncVendorsClient
    from .work_orders.client import WorkOrdersClient, AsyncWorkOrdersClient


class PostmanCusteduApi(BaseService):
    """
    Main SDK client for PostmanCusteduApi (Fern nested resource layout).
    Exposes each top-level resource as a lazy accessor (`client.<resource>.method(...)`),
    threads a single configured transport down to every nested resource client, and binds
    any ungrouped (root) endpoints directly.
    """

    def __init__(
        self,
        *,
        token: Optional[Union[str, Callable[[], str]]] = None,
        base_url: Union[PostmanCusteduApiEnvironment, str, None] = None,
        environment: Optional[PostmanCusteduApiEnvironment] = None,
        timeout: float = None,
        timeout_ms: int = None,
        http_client: Optional[requests.Session] = None,
        follow_redirects: bool = True,
        logger: Optional[logging.Logger] = None,
        retry: "RetryConfig" = None,
    ):
        """Initializes the PostmanCusteduApi SDK client."""
        if environment is not None and base_url is None:
            base_url = environment
        _resolved_url = (
            base_url.value
            if isinstance(base_url, PostmanCusteduApiEnvironment)
            else base_url
        )
        super().__init__(
            base_url=_resolved_url,
            http_client=http_client,
            follow_redirects=follow_redirects,
            logger=logger,
        )
        self._customers = None
        self._vehicles = None
        self._preferences = None
        self._policies = None
        self._coverages = None
        self._drivers = None
        self._coverage_verification = None
        self._claims = None
        self._notes = None
        self._assignments = None
        self._timeline = None
        self._payments = None
        self._refunds = None
        self._payment_methods = None
        self._vendors = None
        self._work_orders = None
        self.set_access_token(token)
        if timeout_ms is not None:
            warnings.warn(
                "`timeout_ms` is deprecated; use `timeout` (in seconds) instead.",
                DeprecationWarning,
                stacklevel=2,
            )
            timeout = timeout_ms / 1000 if timeout is None else timeout
        if timeout is None:
            timeout = 60
        self.set_timeout(timeout)
        if retry is not None:
            self.set_retry(retry)

    def set_base_url(self, base_url: Union[PostmanCusteduApiEnvironment, str]):
        """
        Sets the base URL for the whole SDK, including every resource client already built.

        Resource clients are built lazily and cached holding a COPY of the root's base URL, so the
        inherited setter -- which only rebinds the receiver -- left an already-materialised child
        routing to the old host. Switching environment after one call had built a child kept
        sending that child's requests to the previous server, silently and with no error. Each
        child forwards to its own sub-resources in turn.

        :param base_url: The base URL to be set, as a string or an PostmanCusteduApiEnvironment enum member.
        :return: The SDK instance.
        """
        super().set_base_url(base_url)
        if self._customers is not None:
            self._customers.set_base_url(base_url)
        if self._vehicles is not None:
            self._vehicles.set_base_url(base_url)
        if self._preferences is not None:
            self._preferences.set_base_url(base_url)
        if self._policies is not None:
            self._policies.set_base_url(base_url)
        if self._coverages is not None:
            self._coverages.set_base_url(base_url)
        if self._drivers is not None:
            self._drivers.set_base_url(base_url)
        if self._coverage_verification is not None:
            self._coverage_verification.set_base_url(base_url)
        if self._claims is not None:
            self._claims.set_base_url(base_url)
        if self._notes is not None:
            self._notes.set_base_url(base_url)
        if self._assignments is not None:
            self._assignments.set_base_url(base_url)
        if self._timeline is not None:
            self._timeline.set_base_url(base_url)
        if self._payments is not None:
            self._payments.set_base_url(base_url)
        if self._refunds is not None:
            self._refunds.set_base_url(base_url)
        if self._payment_methods is not None:
            self._payment_methods.set_base_url(base_url)
        if self._vendors is not None:
            self._vendors.set_base_url(base_url)
        if self._work_orders is not None:
            self._work_orders.set_base_url(base_url)

        return self

    def set_config(self, config: SdkConfig):
        """
        Sets service-level configuration for the whole SDK, including every resource client
        already built.

        Resource clients are built lazily and cached holding a reference to the root's config, and
        both this setter and `set_retry` REBIND `_service_config` rather than mutating it -- so a
        caller who touched a resource before reconfiguring the root got a silently stale child.
        The root wins: last writer overwrites, the same rule `set_base_url` and `set_timeout`
        follow, which keeps the root and its resources in exact agreement. Narrower scopes are
        untouched, because method-level config (`set_<method>_config`) and per-call
        `request_config` live in their own attributes and are never overwritten by this. Each
        child forwards to its own sub-resources in turn.

        :param SdkConfig config: Configuration dictionary to override SDK-level defaults.
        :return: The SDK instance.
        """
        super().set_config(config)
        if self._customers is not None:
            self._customers.set_config(config)
        if self._vehicles is not None:
            self._vehicles.set_config(config)
        if self._preferences is not None:
            self._preferences.set_config(config)
        if self._policies is not None:
            self._policies.set_config(config)
        if self._coverages is not None:
            self._coverages.set_config(config)
        if self._drivers is not None:
            self._drivers.set_config(config)
        if self._coverage_verification is not None:
            self._coverage_verification.set_config(config)
        if self._claims is not None:
            self._claims.set_config(config)
        if self._notes is not None:
            self._notes.set_config(config)
        if self._assignments is not None:
            self._assignments.set_config(config)
        if self._timeline is not None:
            self._timeline.set_config(config)
        if self._payments is not None:
            self._payments.set_config(config)
        if self._refunds is not None:
            self._refunds.set_config(config)
        if self._payment_methods is not None:
            self._payment_methods.set_config(config)
        if self._vendors is not None:
            self._vendors.set_config(config)
        if self._work_orders is not None:
            self._work_orders.set_config(config)

        return self

    def set_timeout(self, timeout: float):
        """
        Sets the timeout for the whole SDK, including every resource client already built.

        Resource clients are built lazily and cached with a COPY of the root's timeout baked into
        their request handler, so the inherited setter -- which only rebinds the receiver and
        rebuilds the receiver's handler -- left an already-materialised child on the old timeout.

        :param float timeout: The timeout (in seconds) to be set.
        :return: The SDK instance.
        """
        super().set_timeout(timeout)
        if self._customers is not None:
            self._customers.set_timeout(timeout)
        if self._vehicles is not None:
            self._vehicles.set_timeout(timeout)
        if self._preferences is not None:
            self._preferences.set_timeout(timeout)
        if self._policies is not None:
            self._policies.set_timeout(timeout)
        if self._coverages is not None:
            self._coverages.set_timeout(timeout)
        if self._drivers is not None:
            self._drivers.set_timeout(timeout)
        if self._coverage_verification is not None:
            self._coverage_verification.set_timeout(timeout)
        if self._claims is not None:
            self._claims.set_timeout(timeout)
        if self._notes is not None:
            self._notes.set_timeout(timeout)
        if self._assignments is not None:
            self._assignments.set_timeout(timeout)
        if self._timeline is not None:
            self._timeline.set_timeout(timeout)
        if self._payments is not None:
            self._payments.set_timeout(timeout)
        if self._refunds is not None:
            self._refunds.set_timeout(timeout)
        if self._payment_methods is not None:
            self._payment_methods.set_timeout(timeout)
        if self._vendors is not None:
            self._vendors.set_timeout(timeout)
        if self._work_orders is not None:
            self._work_orders.set_timeout(timeout)

        return self

    def set_http_client(self, http_client: Optional[requests.Session]):
        """
        Sets a custom HTTP client for the whole SDK, including every resource client already
        built.

        Resource clients are built lazily and cached with a COPY of the root's http_client baked
        into their request handler, so the inherited setter -- which only rebinds the receiver and
        rebuilds the receiver's handler -- left an already-materialised child on the old client.

        :param http_client: A requests.Session-compatible client, used as-is. Pass None to fall
            back to the module-level requests API.
        :return: The SDK instance.
        """
        super().set_http_client(http_client)
        if self._customers is not None:
            self._customers.set_http_client(http_client)
        if self._vehicles is not None:
            self._vehicles.set_http_client(http_client)
        if self._preferences is not None:
            self._preferences.set_http_client(http_client)
        if self._policies is not None:
            self._policies.set_http_client(http_client)
        if self._coverages is not None:
            self._coverages.set_http_client(http_client)
        if self._drivers is not None:
            self._drivers.set_http_client(http_client)
        if self._coverage_verification is not None:
            self._coverage_verification.set_http_client(http_client)
        if self._claims is not None:
            self._claims.set_http_client(http_client)
        if self._notes is not None:
            self._notes.set_http_client(http_client)
        if self._assignments is not None:
            self._assignments.set_http_client(http_client)
        if self._timeline is not None:
            self._timeline.set_http_client(http_client)
        if self._payments is not None:
            self._payments.set_http_client(http_client)
        if self._refunds is not None:
            self._refunds.set_http_client(http_client)
        if self._payment_methods is not None:
            self._payment_methods.set_http_client(http_client)
        if self._vendors is not None:
            self._vendors.set_http_client(http_client)
        if self._work_orders is not None:
            self._work_orders.set_http_client(http_client)

        return self

    def set_follow_redirects(self, follow_redirects: bool):
        """
        Sets whether HTTP redirects (3xx responses) are followed automatically, for the whole
        SDK, including every resource client already built.

        :param bool follow_redirects: False to return a 3xx response as-is instead of following it.
        :return: The SDK instance.
        """
        super().set_follow_redirects(follow_redirects)
        if self._customers is not None:
            self._customers.set_follow_redirects(follow_redirects)
        if self._vehicles is not None:
            self._vehicles.set_follow_redirects(follow_redirects)
        if self._preferences is not None:
            self._preferences.set_follow_redirects(follow_redirects)
        if self._policies is not None:
            self._policies.set_follow_redirects(follow_redirects)
        if self._coverages is not None:
            self._coverages.set_follow_redirects(follow_redirects)
        if self._drivers is not None:
            self._drivers.set_follow_redirects(follow_redirects)
        if self._coverage_verification is not None:
            self._coverage_verification.set_follow_redirects(follow_redirects)
        if self._claims is not None:
            self._claims.set_follow_redirects(follow_redirects)
        if self._notes is not None:
            self._notes.set_follow_redirects(follow_redirects)
        if self._assignments is not None:
            self._assignments.set_follow_redirects(follow_redirects)
        if self._timeline is not None:
            self._timeline.set_follow_redirects(follow_redirects)
        if self._payments is not None:
            self._payments.set_follow_redirects(follow_redirects)
        if self._refunds is not None:
            self._refunds.set_follow_redirects(follow_redirects)
        if self._payment_methods is not None:
            self._payment_methods.set_follow_redirects(follow_redirects)
        if self._vendors is not None:
            self._vendors.set_follow_redirects(follow_redirects)
        if self._work_orders is not None:
            self._work_orders.set_follow_redirects(follow_redirects)

        return self

    def set_logging(self, logger: Optional[logging.Logger]):
        """
        Sets the logger requests/responses are written to, for the whole SDK, including every
        resource client already built.

        :param logger: A standard library logger. Pass None (the default) to disable logging.
            Authorization and Cookie header values are always redacted from logged output.
        :return: The SDK instance.
        """
        super().set_logging(logger)
        if self._customers is not None:
            self._customers.set_logging(logger)
        if self._vehicles is not None:
            self._vehicles.set_logging(logger)
        if self._preferences is not None:
            self._preferences.set_logging(logger)
        if self._policies is not None:
            self._policies.set_logging(logger)
        if self._coverages is not None:
            self._coverages.set_logging(logger)
        if self._drivers is not None:
            self._drivers.set_logging(logger)
        if self._coverage_verification is not None:
            self._coverage_verification.set_logging(logger)
        if self._claims is not None:
            self._claims.set_logging(logger)
        if self._notes is not None:
            self._notes.set_logging(logger)
        if self._assignments is not None:
            self._assignments.set_logging(logger)
        if self._timeline is not None:
            self._timeline.set_logging(logger)
        if self._payments is not None:
            self._payments.set_logging(logger)
        if self._refunds is not None:
            self._refunds.set_logging(logger)
        if self._payment_methods is not None:
            self._payment_methods.set_logging(logger)
        if self._vendors is not None:
            self._vendors.set_logging(logger)
        if self._work_orders is not None:
            self._work_orders.set_logging(logger)

        return self

    def set_access_token(self, access_token: Optional[Union[str, Callable[[], str]]]):
        """
        Sets the access token for the whole SDK, including every resource client already built.

        A child is constructed with a COPY of the root's default headers and is then cached, so
        the inherited setter -- which only mutates the receiver's own headers -- left an
        already-materialised child on the old token. Each child forwards to its own sub-resources
        in turn.

        :param access_token: The access token to be set.
        :return: The SDK instance.
        """
        super().set_access_token(access_token)
        if self._customers is not None:
            self._customers.set_access_token(access_token)
        if self._vehicles is not None:
            self._vehicles.set_access_token(access_token)
        if self._preferences is not None:
            self._preferences.set_access_token(access_token)
        if self._policies is not None:
            self._policies.set_access_token(access_token)
        if self._coverages is not None:
            self._coverages.set_access_token(access_token)
        if self._drivers is not None:
            self._drivers.set_access_token(access_token)
        if self._coverage_verification is not None:
            self._coverage_verification.set_access_token(access_token)
        if self._claims is not None:
            self._claims.set_access_token(access_token)
        if self._notes is not None:
            self._notes.set_access_token(access_token)
        if self._assignments is not None:
            self._assignments.set_access_token(access_token)
        if self._timeline is not None:
            self._timeline.set_access_token(access_token)
        if self._payments is not None:
            self._payments.set_access_token(access_token)
        if self._refunds is not None:
            self._refunds.set_access_token(access_token)
        if self._payment_methods is not None:
            self._payment_methods.set_access_token(access_token)
        if self._vendors is not None:
            self._vendors.set_access_token(access_token)
        if self._work_orders is not None:
            self._work_orders.set_access_token(access_token)

        return self

    @property
    def customers(self) -> "CustomersClient":
        """Lazily construct and return the customers resource client."""
        if self._customers is None:
            from .customers.client import CustomersClient

            _child = CustomersClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._customers = _child
        return self._customers

    @property
    def vehicles(self) -> "VehiclesClient":
        """Lazily construct and return the vehicles resource client."""
        if self._vehicles is None:
            from .vehicles.client import VehiclesClient

            _child = VehiclesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._vehicles = _child
        return self._vehicles

    @property
    def preferences(self) -> "PreferencesClient":
        """Lazily construct and return the preferences resource client."""
        if self._preferences is None:
            from .preferences.client import PreferencesClient

            _child = PreferencesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._preferences = _child
        return self._preferences

    @property
    def policies(self) -> "PoliciesClient":
        """Lazily construct and return the policies resource client."""
        if self._policies is None:
            from .policies.client import PoliciesClient

            _child = PoliciesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._policies = _child
        return self._policies

    @property
    def coverages(self) -> "CoveragesClient":
        """Lazily construct and return the coverages resource client."""
        if self._coverages is None:
            from .coverages.client import CoveragesClient

            _child = CoveragesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._coverages = _child
        return self._coverages

    @property
    def drivers(self) -> "DriversClient":
        """Lazily construct and return the drivers resource client."""
        if self._drivers is None:
            from .drivers.client import DriversClient

            _child = DriversClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._drivers = _child
        return self._drivers

    @property
    def coverage_verification(self) -> "CoverageVerificationClient":
        """Lazily construct and return the coverage_verification resource client."""
        if self._coverage_verification is None:
            from .coverage_verification.client import CoverageVerificationClient

            _child = CoverageVerificationClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._coverage_verification = _child
        return self._coverage_verification

    @property
    def claims(self) -> "ClaimsClient":
        """Lazily construct and return the claims resource client."""
        if self._claims is None:
            from .claims.client import ClaimsClient

            _child = ClaimsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._claims = _child
        return self._claims

    @property
    def notes(self) -> "NotesClient":
        """Lazily construct and return the notes resource client."""
        if self._notes is None:
            from .notes.client import NotesClient

            _child = NotesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._notes = _child
        return self._notes

    @property
    def assignments(self) -> "AssignmentsClient":
        """Lazily construct and return the assignments resource client."""
        if self._assignments is None:
            from .assignments.client import AssignmentsClient

            _child = AssignmentsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._assignments = _child
        return self._assignments

    @property
    def timeline(self) -> "TimelineClient":
        """Lazily construct and return the timeline resource client."""
        if self._timeline is None:
            from .timeline.client import TimelineClient

            _child = TimelineClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._timeline = _child
        return self._timeline

    @property
    def payments(self) -> "PaymentsClient":
        """Lazily construct and return the payments resource client."""
        if self._payments is None:
            from .payments.client import PaymentsClient

            _child = PaymentsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._payments = _child
        return self._payments

    @property
    def refunds(self) -> "RefundsClient":
        """Lazily construct and return the refunds resource client."""
        if self._refunds is None:
            from .refunds.client import RefundsClient

            _child = RefundsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._refunds = _child
        return self._refunds

    @property
    def payment_methods(self) -> "PaymentMethodsClient":
        """Lazily construct and return the payment_methods resource client."""
        if self._payment_methods is None:
            from .payment_methods.client import PaymentMethodsClient

            _child = PaymentMethodsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._payment_methods = _child
        return self._payment_methods

    @property
    def vendors(self) -> "VendorsClient":
        """Lazily construct and return the vendors resource client."""
        if self._vendors is None:
            from .vendors.client import VendorsClient

            _child = VendorsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._vendors = _child
        return self._vendors

    @property
    def work_orders(self) -> "WorkOrdersClient":
        """Lazily construct and return the work_orders resource client."""
        if self._work_orders is None:
            from .work_orders.client import WorkOrdersClient

            _child = WorkOrdersClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._work_orders = _child
        return self._work_orders

    @property
    def with_raw_response(self) -> "RawPostmanCusteduApi":
        """
        Returns a raw-response client whose methods mirror this client's ROOT endpoints but return
        ``HttpResponse[T]`` (parsed body plus the raw status code and headers) instead of the bare
        deserialized body. Resource clients expose their own `with_raw_response`.
        """
        return RawPostmanCusteduApi(self)


class RawPostmanCusteduApi:
    """
    Raw-response client for PostmanCusteduApi's root endpoints.

    Each method delegates to the matching :class:`PostmanCusteduApi` method and wraps the result in an
    ``HttpResponse[T]`` so callers can read ``.data`` alongside ``.status_code`` and ``.headers``.
    A fully-grouped spec binds nothing to the root, so this is then a bare shell and the endpoints
    are reached through each resource client's own raw client.
    """

    def __init__(self, client: PostmanCusteduApi):
        self._client = client


class AsyncPostmanCusteduApi(PostmanCusteduApi):
    """
    Async SDK client for PostmanCusteduApi. Mirrors the sync client with awaitable endpoints and async
    resource accessors.
    """

    def __init__(
        self,
        *,
        token: Optional[Union[str, Callable[[], str]]] = None,
        base_url: Union[PostmanCusteduApiEnvironment, str, None] = None,
        environment: Optional[PostmanCusteduApiEnvironment] = None,
        timeout: float = None,
        timeout_ms: int = None,
        http_client: Optional[requests.Session] = None,
        follow_redirects: bool = True,
        logger: Optional[logging.Logger] = None,
        retry: "RetryConfig" = None,
        async_token: Optional[Callable[[], Awaitable[str]]] = None,
    ):
        """Initializes the async client; ``async_token`` is an async token supplier, used when ``token`` is unset."""
        if async_token is not None and token is None:
            token = async_token
        super().__init__(
            token=token,
            base_url=base_url,
            environment=environment,
            timeout=timeout,
            timeout_ms=timeout_ms,
            http_client=http_client,
            follow_redirects=follow_redirects,
            logger=logger,
            retry=retry,
        )

    @property
    def customers(self) -> "AsyncCustomersClient":
        """Lazily construct and return the async customers resource client."""
        if self._customers is None:
            from .customers.client import AsyncCustomersClient

            _child = AsyncCustomersClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._customers = _child
        return self._customers

    @property
    def vehicles(self) -> "AsyncVehiclesClient":
        """Lazily construct and return the async vehicles resource client."""
        if self._vehicles is None:
            from .vehicles.client import AsyncVehiclesClient

            _child = AsyncVehiclesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._vehicles = _child
        return self._vehicles

    @property
    def preferences(self) -> "AsyncPreferencesClient":
        """Lazily construct and return the async preferences resource client."""
        if self._preferences is None:
            from .preferences.client import AsyncPreferencesClient

            _child = AsyncPreferencesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._preferences = _child
        return self._preferences

    @property
    def policies(self) -> "AsyncPoliciesClient":
        """Lazily construct and return the async policies resource client."""
        if self._policies is None:
            from .policies.client import AsyncPoliciesClient

            _child = AsyncPoliciesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._policies = _child
        return self._policies

    @property
    def coverages(self) -> "AsyncCoveragesClient":
        """Lazily construct and return the async coverages resource client."""
        if self._coverages is None:
            from .coverages.client import AsyncCoveragesClient

            _child = AsyncCoveragesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._coverages = _child
        return self._coverages

    @property
    def drivers(self) -> "AsyncDriversClient":
        """Lazily construct and return the async drivers resource client."""
        if self._drivers is None:
            from .drivers.client import AsyncDriversClient

            _child = AsyncDriversClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._drivers = _child
        return self._drivers

    @property
    def coverage_verification(self) -> "AsyncCoverageVerificationClient":
        """Lazily construct and return the async coverage_verification resource client."""
        if self._coverage_verification is None:
            from .coverage_verification.client import AsyncCoverageVerificationClient

            _child = AsyncCoverageVerificationClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._coverage_verification = _child
        return self._coverage_verification

    @property
    def claims(self) -> "AsyncClaimsClient":
        """Lazily construct and return the async claims resource client."""
        if self._claims is None:
            from .claims.client import AsyncClaimsClient

            _child = AsyncClaimsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._claims = _child
        return self._claims

    @property
    def notes(self) -> "AsyncNotesClient":
        """Lazily construct and return the async notes resource client."""
        if self._notes is None:
            from .notes.client import AsyncNotesClient

            _child = AsyncNotesClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._notes = _child
        return self._notes

    @property
    def assignments(self) -> "AsyncAssignmentsClient":
        """Lazily construct and return the async assignments resource client."""
        if self._assignments is None:
            from .assignments.client import AsyncAssignmentsClient

            _child = AsyncAssignmentsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._assignments = _child
        return self._assignments

    @property
    def timeline(self) -> "AsyncTimelineClient":
        """Lazily construct and return the async timeline resource client."""
        if self._timeline is None:
            from .timeline.client import AsyncTimelineClient

            _child = AsyncTimelineClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._timeline = _child
        return self._timeline

    @property
    def payments(self) -> "AsyncPaymentsClient":
        """Lazily construct and return the async payments resource client."""
        if self._payments is None:
            from .payments.client import AsyncPaymentsClient

            _child = AsyncPaymentsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._payments = _child
        return self._payments

    @property
    def refunds(self) -> "AsyncRefundsClient":
        """Lazily construct and return the async refunds resource client."""
        if self._refunds is None:
            from .refunds.client import AsyncRefundsClient

            _child = AsyncRefundsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._refunds = _child
        return self._refunds

    @property
    def payment_methods(self) -> "AsyncPaymentMethodsClient":
        """Lazily construct and return the async payment_methods resource client."""
        if self._payment_methods is None:
            from .payment_methods.client import AsyncPaymentMethodsClient

            _child = AsyncPaymentMethodsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._payment_methods = _child
        return self._payment_methods

    @property
    def vendors(self) -> "AsyncVendorsClient":
        """Lazily construct and return the async vendors resource client."""
        if self._vendors is None:
            from .vendors.client import AsyncVendorsClient

            _child = AsyncVendorsClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._vendors = _child
        return self._vendors

    @property
    def work_orders(self) -> "AsyncWorkOrdersClient":
        """Lazily construct and return the async work_orders resource client."""
        if self._work_orders is None:
            from .work_orders.client import AsyncWorkOrdersClient

            _child = AsyncWorkOrdersClient(base_url=self.base_url)
            _child._default_headers = self._default_headers.copy()
            _child._timeout = self._timeout
            _child._http_client = self._http_client
            _child._follow_redirects = self._follow_redirects
            _child._logger = self._logger
            _child._service_config = self._service_config
            _child._update_request_handler()
            self._work_orders = _child
        return self._work_orders

    @property
    def with_raw_response(self) -> "AsyncRawPostmanCusteduApi":
        """
        Returns an async raw-response client whose methods mirror this client's ROOT endpoints but
        return ``HttpResponse[T]`` (parsed body plus the raw status code and headers).
        """
        return AsyncRawPostmanCusteduApi(self)


class AsyncRawPostmanCusteduApi:
    """
    Async raw-response client for AsyncPostmanCusteduApi's root endpoints.
    """

    def __init__(self, client: AsyncPostmanCusteduApi):
        self._client = client
