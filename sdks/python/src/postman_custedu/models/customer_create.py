from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .address import Address
from .preferences import Preferences


class CustomerCreate(BaseModel):
    """CustomerCreate

    :param first_name: first_name
    :type first_name: str
    :param last_name: last_name
    :type last_name: str
    :param email: email
    :type email: str
    :param phone: phone, defaults to None
    :type phone: str, optional
    :param date_of_birth: date_of_birth, defaults to None
    :type date_of_birth: str, optional
    :param address: address, defaults to None
    :type address: Address, optional
    :param preferences: preferences, defaults to None
    :type preferences: Preferences, optional
    """

    first_name: str = Field(alias="firstName", serialization_alias="firstName")
    last_name: str = Field(alias="lastName", serialization_alias="lastName")
    email: str
    phone: Optional[str] = Field(default=None)
    date_of_birth: Optional[str] = Field(
        alias="dateOfBirth", serialization_alias="dateOfBirth", default=None
    )
    address: Optional[Address] = Field(default=None)
    preferences: Optional[Preferences] = Field(default=None)
