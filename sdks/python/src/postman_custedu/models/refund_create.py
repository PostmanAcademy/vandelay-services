from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .money import Money

RefundCreateReason = typing.Union[
    typing.Literal["overpayment", "duplicate", "claim_reversed", "other"], typing.Any
]


class RefundCreate(BaseModel):
    """RefundCreate

    :param amount: amount
    :type amount: Money
    :param reason: reason
    :type reason: RefundCreateReason
    """

    amount: Money
    reason: RefundCreateReason
