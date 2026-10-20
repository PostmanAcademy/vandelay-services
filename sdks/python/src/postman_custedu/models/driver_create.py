from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

DriverCreateRelationship = typing.Union[
    typing.Literal["self", "spouse", "child", "other"], typing.Any
]


class DriverCreate(BaseModel):
    """DriverCreate

    :param first_name: first_name
    :type first_name: str
    :param last_name: last_name
    :type last_name: str
    :param date_of_birth: date_of_birth
    :type date_of_birth: str
    :param license_number: license_number
    :type license_number: str
    :param license_state: license_state
    :type license_state: str
    :param relationship: relationship
    :type relationship: DriverCreateRelationship
    """

    first_name: str = Field(alias="firstName", serialization_alias="firstName")
    last_name: str = Field(alias="lastName", serialization_alias="lastName")
    date_of_birth: str = Field(alias="dateOfBirth", serialization_alias="dateOfBirth")
    license_number: str = Field(
        alias="licenseNumber", serialization_alias="licenseNumber"
    )
    license_state: str = Field(alias="licenseState", serialization_alias="licenseState")
    relationship: DriverCreateRelationship
