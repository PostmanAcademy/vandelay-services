from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .address import Address


class CustomerUpdate(BaseModel):
    """CustomerUpdate

    :param first_name: first_name, defaults to None
    :type first_name: str, optional
    :param last_name: last_name, defaults to None
    :type last_name: str, optional
    :param email: email, defaults to None
    :type email: str, optional
    :param phone: phone, defaults to None
    :type phone: str, optional
    :param address: address, defaults to None
    :type address: Address, optional
    """

    first_name: Optional[str] = Field(
        alias="firstName", serialization_alias="firstName", default=None
    )
    last_name: Optional[str] = Field(
        alias="lastName", serialization_alias="lastName", default=None
    )
    email: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    address: Optional[Address] = Field(default=None)
