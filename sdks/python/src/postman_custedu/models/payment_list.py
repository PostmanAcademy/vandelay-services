from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from typing import Union
from .utils.base_model import BaseModel
from .payment import Payment


class PaymentList(BaseModel):
    """PaymentList

    :param data: data
    :type data: List[Payment]
    :param next_cursor: next_cursor, defaults to None
    :type next_cursor: str, optional
    """

    data: List[Payment]
    next_cursor: Optional[str] = Field(
        alias="nextCursor", serialization_alias="nextCursor", default=None
    )
