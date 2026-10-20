from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

DriverRelationship = typing.Union[
    typing.Literal["self", "spouse", "child", "other"], typing.Any
]


class Driver(BaseModel):
    """Driver

    :param id: id
    :type id: str
    :param first_name: first_name
    :type first_name: str
    :param last_name: last_name
    :type last_name: str
    :param license_state: license_state, defaults to None
    :type license_state: str, optional
    :param relationship: relationship
    :type relationship: DriverRelationship
    """

    id: str
    first_name: str = Field(alias="firstName", serialization_alias="firstName")
    last_name: str = Field(alias="lastName", serialization_alias="lastName")
    license_state: Optional[str] = Field(
        alias="licenseState", serialization_alias="licenseState", default=None
    )
    relationship: DriverRelationship
