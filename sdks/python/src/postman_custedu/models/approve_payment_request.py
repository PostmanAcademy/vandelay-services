from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel


class ApprovePaymentRequest(BaseModel):
    """ApprovePaymentRequest

    :param comment: comment, defaults to None
    :type comment: str, optional
    """

    comment: Optional[str] = Field(default=None)
