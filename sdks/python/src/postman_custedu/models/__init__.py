"""Lazy model exports.

Names are resolved on first attribute access via PEP 562 ``__getattr__``,
then cached in module globals. Avoids the multi-second eager-import cost
on SDKs with thousands of generated models.
"""

import importlib
import typing

import pydantic

from .utils import base_model as _base_model

# Names a model annotation can mention besides a model class. Pydantic re-evaluates an INHERITED
# annotation that needs a forward ref in the SUBCLASS's module, not the base's, so a fernMode
# `<Union>_<Variant>` subclass of a model declaring ``children: List[AstNodeInput]`` looks for
# ``List`` in the union's module -- which has no reason to import it. Supplying them through the
# rebuild namespace covers every such name at once. Module globals are layered on top, so a schema
# that happens to be named ``Field`` still wins.
_BUILTIN_NAMESPACE = {
    "typing": typing,
    "Annotated": typing.Annotated,
    "Any": typing.Any,
    "Dict": typing.Dict,
    "List": typing.List,
    "Literal": typing.Literal,
    "Optional": typing.Optional,
    "Union": typing.Union,
    "Field": pydantic.Field,
    "TypeAdapter": pydantic.TypeAdapter,
    "UniqueItems": _base_model.UniqueItems,
}

_MODEL_TO_MODULE = {
    "CustomerList": "customer_list",
    "CustomerCreate": "customer_create",
    "Customer": "customer",
    "CustomerStatus": "customer",
    "CustomerUpdate": "customer_update",
    "ListCustomerVehiclesResponse": "list_customer_vehicles_response",
    "VehicleCreate": "vehicle_create",
    "Vehicle": "vehicle",
    "ListPolicyVehiclesResponse": "list_policy_vehicles_response",
    "Preferences": "preferences",
    "PreferencesContactMethod": "preferences",
    "PolicyList": "policy_list",
    "PolicyStatus": "policy_status",
    "PolicyDetail": "policy_detail",
    "PolicyDetailProduct": "policy_detail",
    "PolicyDetailBillingFrequency": "policy_detail",
    "ListPolicyCoveragesResponse": "list_policy_coverages_response",
    "ListPolicyDriversResponse": "list_policy_drivers_response",
    "DriverCreate": "driver_create",
    "DriverCreateRelationship": "driver_create",
    "Driver": "driver",
    "DriverRelationship": "driver",
    "CoverageVerificationRequest": "coverage_verification_request",
    "CoverageVerificationRequestClaimType": "coverage_verification_request",
    "CoverageVerification": "coverage_verification",
    "CoverageVerificationReasonsItem": "coverage_verification",
    "ClaimList": "claim_list",
    "ClaimStatus": "claim_status",
    "ClaimCreate": "claim_create",
    "Claim": "claim",
    "ClaimUpdate": "claim_update",
    "CancelRequest": "cancel_request",
    "CancelRequestReason": "cancel_request",
    "ListClaimNotesResponse": "list_claim_notes_response",
    "NoteCreate": "note_create",
    "NoteCreateVisibility": "note_create",
    "Note": "note",
    "NoteAuthor": "note",
    "NoteVisibility": "note",
    "NoteAuthorType": "note",
    "ListClaimAssignmentsResponse": "list_claim_assignments_response",
    "AssignmentCreate": "assignment_create",
    "AssignmentCreateRole": "assignment_create",
    "Assignment": "assignment",
    "AssignmentRole": "assignment",
    "AssignmentStatus": "assignment",
    "GetClaimTimelineResponse": "get_claim_timeline_response",
    "PaymentList": "payment_list",
    "PaymentStatus": "payment_status",
    "PaymentCreate": "payment_create",
    "PaymentCreateType": "payment_create",
    "Payment": "payment",
    "PaymentType": "payment",
    "ApprovePaymentRequest": "approve_payment_request",
    "CancelPaymentRequest": "cancel_payment_request",
    "CancelPaymentRequestReason": "cancel_payment_request",
    "ListPaymentRefundsResponse": "list_payment_refunds_response",
    "RefundCreate": "refund_create",
    "RefundCreateReason": "refund_create",
    "Refund": "refund",
    "RefundReason": "refund",
    "RefundStatus": "refund",
    "ListPaymentMethodsResponse": "list_payment_methods_response",
    "PaymentMethodCreate": "payment_method_create",
    "PaymentMethodCreateType": "payment_method_create",
    "PaymentMethod": "payment_method",
    "PaymentMethodType": "payment_method",
    "VendorList": "vendor_list",
    "VendorType": "vendor_type",
    "VendorCreate": "vendor_create",
    "Vendor": "vendor",
    "VendorStatus": "vendor",
    "VendorUpdate": "vendor_update",
    "VendorUpdateStatus": "vendor_update",
    "ListWorkOrdersResponse": "list_work_orders_response",
    "WorkOrderStatus": "work_order_status",
    "WorkOrderCreate": "work_order_create",
    "WorkOrder": "work_order",
    "WorkOrderUpdate": "work_order_update",
    "Money": "money",
    "Address": "address",
    "InsuredVehicle": "insured_vehicle",
    "Policy": "policy",
    "PolicyProduct": "policy",
    "PolicyBillingFrequency": "policy",
    "Coverage": "coverage",
    "ClaimType": "claim_type",
    "TimelineEvent": "timeline_event",
    "TimelineEventActor": "timeline_event",
    "Payee": "payee",
    "PayeeType": "payee",
    "PaymentRail": "payment_rail",
    "Problem": "problem",
    "ProblemErrorsItem": "problem",
}

_REBUILD_NAMES = frozenset(
    {
        "CustomerList",
        "CustomerCreate",
        "Customer",
        "CustomerUpdate",
        "ListCustomerVehiclesResponse",
        "VehicleCreate",
        "Vehicle",
        "ListPolicyVehiclesResponse",
        "Preferences",
        "PolicyList",
        "PolicyDetail",
        "ListPolicyCoveragesResponse",
        "ListPolicyDriversResponse",
        "DriverCreate",
        "Driver",
        "CoverageVerificationRequest",
        "CoverageVerification",
        "CoverageVerificationReasonsItem",
        "ClaimList",
        "ClaimCreate",
        "Claim",
        "ClaimUpdate",
        "CancelRequest",
        "ListClaimNotesResponse",
        "NoteCreate",
        "Note",
        "NoteAuthor",
        "ListClaimAssignmentsResponse",
        "AssignmentCreate",
        "Assignment",
        "GetClaimTimelineResponse",
        "PaymentList",
        "PaymentCreate",
        "Payment",
        "ApprovePaymentRequest",
        "CancelPaymentRequest",
        "ListPaymentRefundsResponse",
        "RefundCreate",
        "Refund",
        "ListPaymentMethodsResponse",
        "PaymentMethodCreate",
        "PaymentMethod",
        "VendorList",
        "VendorCreate",
        "Vendor",
        "VendorUpdate",
        "ListWorkOrdersResponse",
        "WorkOrderCreate",
        "WorkOrder",
        "WorkOrderUpdate",
        "Money",
        "Address",
        "InsuredVehicle",
        "Policy",
        "Coverage",
        "TimelineEvent",
        "TimelineEventActor",
        "Payee",
    }
)

__all__ = list(_MODEL_TO_MODULE.keys())

_rebuilt = False


def _load(name):
    module = _MODEL_TO_MODULE.get(name)
    if module is None:
        return None
    obj = getattr(importlib.import_module("." + module, __name__), name)
    globals()[name] = obj
    return obj


def _rebuild(cls, ns):
    """Rebuild ``cls``, loading on demand whatever its forward refs still need.

    A deferred model can forward-reference a name that is not itself a
    BaseModel — a module-level ``Union`` alias is the common case — and
    no amount of rebuilding the BaseModels brings that alias into ``ns``.
    Pydantic names the one it is missing, so load exactly that and retry
    rather than eagerly importing every model, which is the cost this
    module exists to avoid.

    ``PydanticUndefinedAnnotation`` carries ``.name``; the ``name in ns``
    guard is what terminates the loop, since ``_load`` either adds the
    name or there is nothing more to try. The bound on the iteration count
    is a second belt: it holds even if a future pydantic reports a name
    that never equals the key inserted for it, which would otherwise hang
    an SDK rather than fail it.
    """
    for _ in range(len(_MODEL_TO_MODULE) + 1):
        try:
            # _types_namespace is mandatory: pydantic resolves forward refs
            # against caller-frame locals by default, but we're calling from
            # inside a helper — the names live in this module's globals.
            cls.model_rebuild(_types_namespace=ns)
            return
        except pydantic.PydanticUndefinedAnnotation as missing:
            name = missing.name
            if name in ns:
                return
            try:
                obj = _load(name)
            except Exception:
                return
            if obj is None:
                return
            ns[name] = obj
        except Exception:
            return


def _ensure_rebuilt():
    """Resolve forward refs across every BaseModel in one batched pass.

    Individual model files import their cross-references inside a
    ``TYPE_CHECKING`` block, so at runtime each file's globals contain
    only itself. ``model_rebuild()`` walks the call stack to find
    forward-ref names — calling it from this module once every
    BaseModel has been loaded into our globals is what lets pydantic
    resolve circular refs (the same shape the prior eager-import form
    relied on). Enums, Union types, and error models stay lazy until a
    rebuild asks for one.
    """
    global _rebuilt
    if _rebuilt:
        return
    _rebuilt = True
    for name in _REBUILD_NAMES:
        if name not in globals():
            try:
                _load(name)
            except Exception:
                pass
    ns = dict(_BUILTIN_NAMESPACE)
    ns.update(globals())
    for name in _REBUILD_NAMES:
        cls = globals().get(name)
        if cls is None:
            continue
        _rebuild(cls, ns)


def __getattr__(name):
    if name not in _MODEL_TO_MODULE:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    obj = _load(name)
    if name in _REBUILD_NAMES:
        _ensure_rebuilt()
    return obj


def __dir__():
    return sorted(set(globals()).union(_MODEL_TO_MODULE))
