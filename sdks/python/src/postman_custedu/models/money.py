from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel


class Money(BaseModel):
    """Money

    :param amount: amount
    :type amount: float
    :param currency: currency
    :type currency: str
    """

    amount: float
    currency: str
