from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .payment_method import PaymentMethod


class ListPaymentMethodsResponse(BaseModel):
    """ListPaymentMethodsResponse

    :param data: data
    :type data: List[PaymentMethod]
    """

    data: List[PaymentMethod]
