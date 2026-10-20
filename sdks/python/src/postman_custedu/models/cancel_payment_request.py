from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

CancelPaymentRequestReason = typing.Union[
    typing.Literal[
        "duplicate", "incorrect_amount", "incorrect_payee", "claim_cancelled", "other"
    ],
    typing.Any,
]


class CancelPaymentRequest(BaseModel):
    """CancelPaymentRequest

    :param reason: reason
    :type reason: CancelPaymentRequestReason
    :param comment: comment, defaults to None
    :type comment: str, optional
    """

    reason: CancelPaymentRequestReason
    comment: Optional[str] = Field(default=None)
