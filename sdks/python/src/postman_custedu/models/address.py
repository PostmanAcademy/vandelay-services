from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel


class Address(BaseModel):
    """Address

    :param address_line1: address_line1
    :type address_line1: str
    :param address_line2: address_line2, defaults to None
    :type address_line2: str, optional
    :param city: city
    :type city: str
    :param state: state
    :type state: str
    :param postal_code: postal_code
    :type postal_code: str
    :param country: country
    :type country: str
    """

    address_line1: str = Field(alias="addressLine1", serialization_alias="addressLine1")
    address_line2: Optional[str] = Field(
        alias="addressLine2", serialization_alias="addressLine2", default=None
    )
    city: str
    state: str
    postal_code: str = Field(alias="postalCode", serialization_alias="postalCode")
    country: str
