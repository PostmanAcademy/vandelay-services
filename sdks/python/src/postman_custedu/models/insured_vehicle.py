from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel


class InsuredVehicle(BaseModel):
    """InsuredVehicle

    :param id: id
    :type id: str
    :param vin: vin
    :type vin: str
    :param year: year
    :type year: int
    :param make: make
    :type make: str
    :param model: model
    :type model: str
    """

    id: str
    vin: str
    year: int
    make: str
    model: str
