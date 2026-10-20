from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .payee import Payee
from .money import Money
from .payment_status import PaymentStatus
from .payment_rail import PaymentRail

PaymentType = typing.Union[
    typing.Literal[
        "settlement", "vendor_invoice", "rental_reimbursement", "premium_refund"
    ],
    typing.Any,
]


class Payment(BaseModel):
    """Payment

    :param id: id
    :type id: str
    :param claim_id: claim_id
    :type claim_id: str
    :param type: type
    :type type: PaymentType
    :param payee: payee
    :type payee: Payee
    :param payment_method_id: payment_method_id, defaults to None
    :type payment_method_id: str, optional
    :param amount: amount
    :type amount: Money
    :param status: status
    :type status: PaymentStatus
    :param method: method, defaults to None
    :type method: PaymentRail, optional
    :param invoice_number: invoice_number, defaults to None
    :type invoice_number: str, optional
    :param memo: memo, defaults to None
    :type memo: str, optional
    :param created_at: created_at
    :type created_at: str
    :param completed_at: completed_at, defaults to None
    :type completed_at: str, optional
    """

    id: str
    claim_id: str = Field(alias="claimId", serialization_alias="claimId")
    type: PaymentType
    payee: Payee
    payment_method_id: Optional[str] = Field(
        alias="paymentMethodId", serialization_alias="paymentMethodId", default=None
    )
    amount: Money
    status: PaymentStatus
    method: Optional[PaymentRail] = Field(default=None)
    invoice_number: Optional[str] = Field(
        alias="invoiceNumber", serialization_alias="invoiceNumber", default=None
    )
    memo: Optional[str] = Field(default=None)
    created_at: str = Field(alias="createdAt", serialization_alias="createdAt")
    completed_at: Optional[str] = Field(
        alias="completedAt", serialization_alias="completedAt", default=None
    )
