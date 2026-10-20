from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

PaymentMethodCreateType = typing.Union[
    typing.Literal["bank_account", "debit_card"], typing.Any
]


class PaymentMethodCreate(BaseModel):
    """PaymentMethodCreate

    :param payee_id: payee_id
    :type payee_id: str
    :param type: type
    :type type: PaymentMethodCreateType
    :param token: Single-use token from the hosted payment form.
    :type token: str
    :param is_default: is_default, defaults to None
    :type is_default: bool, optional
    """

    payee_id: str = Field(alias="payeeId", serialization_alias="payeeId")
    type: PaymentMethodCreateType
    token: str = Field(description="Single-use token from the hosted payment form.")
    is_default: Optional[bool] = Field(
        alias="isDefault", serialization_alias="isDefault", default=None
    )
