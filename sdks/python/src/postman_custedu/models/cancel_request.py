from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

CancelRequestReason = typing.Union[
    typing.Literal[
        "customer_request", "duplicate", "fraud_suspected", "policy_issue", "other"
    ],
    typing.Any,
]


class CancelRequest(BaseModel):
    """CancelRequest

    :param reason: reason
    :type reason: CancelRequestReason
    :param comment: comment, defaults to None
    :type comment: str, optional
    """

    reason: CancelRequestReason
    comment: Optional[str] = Field(default=None)
