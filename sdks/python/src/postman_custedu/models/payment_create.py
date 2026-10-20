from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .payee import Payee
from .money import Money

PaymentCreateType = typing.Union[
    typing.Literal[
        "settlement", "vendor_invoice", "rental_reimbursement", "premium_refund"
    ],
    typing.Any,
]


class PaymentCreate(BaseModel):
    """PaymentCreate

    :param claim_id: claim_id
    :type claim_id: str
    :param type: type
    :type type: PaymentCreateType
    :param payee: payee
    :type payee: Payee
    :param payment_method_id: payment_method_id
    :type payment_method_id: str
    :param amount: amount
    :type amount: Money
    :param invoice_number: invoice_number, defaults to None
    :type invoice_number: str, optional
    :param memo: memo, defaults to None
    :type memo: str, optional
    """

    claim_id: str = Field(alias="claimId", serialization_alias="claimId")
    type: PaymentCreateType
    payee: Payee
    payment_method_id: str = Field(
        alias="paymentMethodId", serialization_alias="paymentMethodId"
    )
    amount: Money
    invoice_number: Optional[str] = Field(
        alias="invoiceNumber", serialization_alias="invoiceNumber", default=None
    )
    memo: Optional[str] = Field(default=None)
