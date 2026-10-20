from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel


class VehicleCreate(BaseModel):
    """VehicleCreate

    :param vin: vin
    :type vin: str
    :param year: year
    :type year: int
    :param make: make
    :type make: str
    :param model: model
    :type model: str
    :param trim: trim, defaults to None
    :type trim: str, optional
    :param color: color, defaults to None
    :type color: str, optional
    :param license_plate: license_plate, defaults to None
    :type license_plate: str, optional
    :param license_plate_state: license_plate_state, defaults to None
    :type license_plate_state: str, optional
    """

    vin: str
    year: int
    make: str
    model: str
    trim: Optional[str] = Field(default=None)
    color: Optional[str] = Field(default=None)
    license_plate: Optional[str] = Field(
        alias="licensePlate", serialization_alias="licensePlate", default=None
    )
    license_plate_state: Optional[str] = Field(
        alias="licensePlateState", serialization_alias="licensePlateState", default=None
    )
