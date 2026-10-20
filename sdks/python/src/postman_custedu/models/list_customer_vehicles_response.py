from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .vehicle import Vehicle


class ListCustomerVehiclesResponse(BaseModel):
    """ListCustomerVehiclesResponse

    :param data: data
    :type data: List[Vehicle]
    """

    data: List[Vehicle]
