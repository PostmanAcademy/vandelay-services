from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .money import Money

RefundReason = typing.Union[
    typing.Literal["overpayment", "duplicate", "claim_reversed", "other"], typing.Any
]

RefundStatus = typing.Union[
    typing.Literal["processing", "completed", "failed"], typing.Any
]


class Refund(BaseModel):
    """Refund

    :param id: id
    :type id: str
    :param payment_id: payment_id
    :type payment_id: str
    :param amount: amount
    :type amount: Money
    :param reason: reason
    :type reason: RefundReason
    :param status: status
    :type status: RefundStatus
    :param created_at: created_at
    :type created_at: str
    """

    id: str
    payment_id: str = Field(alias="paymentId", serialization_alias="paymentId")
    amount: Money
    reason: RefundReason
    status: RefundStatus
    created_at: str = Field(alias="createdAt", serialization_alias="createdAt")
