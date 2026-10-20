from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .address import Address
from .preferences import Preferences

CustomerStatus = typing.Union[
    typing.Literal["active", "inactive", "suspended"], typing.Any
]


class Customer(BaseModel):
    """Customer

    :param id: id
    :type id: str
    :param first_name: first_name
    :type first_name: str
    :param last_name: last_name
    :type last_name: str
    :param email: email
    :type email: str
    :param phone: E.164 format., defaults to None
    :type phone: str, optional
    :param date_of_birth: Masked (`YYYY-**-**`) without the `customers:pii:read` scope., defaults to None
    :type date_of_birth: str, optional
    :param address: address, defaults to None
    :type address: Address, optional
    :param status: status
    :type status: CustomerStatus
    :param preferences: preferences, defaults to None
    :type preferences: Preferences, optional
    :param created_at: created_at
    :type created_at: str
    :param updated_at: updated_at
    :type updated_at: str
    """

    id: str
    first_name: str = Field(alias="firstName", serialization_alias="firstName")
    last_name: str = Field(alias="lastName", serialization_alias="lastName")
    email: str
    phone: Optional[str] = Field(default=None, description="E.164 format.")
    date_of_birth: Optional[str] = Field(
        alias="dateOfBirth",
        serialization_alias="dateOfBirth",
        default=None,
        description="Masked (`YYYY-**-**`) without the `customers:pii:read` scope.",
    )
    address: Optional[Address] = Field(default=None)
    status: CustomerStatus
    preferences: Optional[Preferences] = Field(default=None)
    created_at: str = Field(alias="createdAt", serialization_alias="createdAt")
    updated_at: str = Field(alias="updatedAt", serialization_alias="updatedAt")
