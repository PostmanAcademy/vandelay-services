from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .refund import Refund


class ListPaymentRefundsResponse(BaseModel):
    """ListPaymentRefundsResponse

    :param data: data
    :type data: List[Refund]
    """

    data: List[Refund]
