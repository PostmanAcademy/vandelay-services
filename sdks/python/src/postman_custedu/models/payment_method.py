from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

PaymentMethodType = typing.Union[
    typing.Literal["bank_account", "debit_card"], typing.Any
]


class PaymentMethod(BaseModel):
    """PaymentMethod

    :param id: id
    :type id: str
    :param payee_id: payee_id
    :type payee_id: str
    :param type: type
    :type type: PaymentMethodType
    :param label: label, defaults to None
    :type label: str, optional
    :param last4: last4
    :type last4: str
    :param bank_name: bank_name, defaults to None
    :type bank_name: str, optional
    :param is_default: is_default, defaults to None
    :type is_default: bool, optional
    """

    id: str
    payee_id: str = Field(alias="payeeId", serialization_alias="payeeId")
    type: PaymentMethodType
    label: Optional[str] = Field(default=None)
    last4: str
    bank_name: Optional[str] = Field(
        alias="bankName", serialization_alias="bankName", default=None
    )
    is_default: Optional[bool] = Field(
        alias="isDefault", serialization_alias="isDefault", default=None
    )
