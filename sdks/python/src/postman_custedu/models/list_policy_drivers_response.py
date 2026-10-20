from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .driver import Driver


class ListPolicyDriversResponse(BaseModel):
    """ListPolicyDriversResponse

    :param data: data
    :type data: List[Driver]
    """

    data: List[Driver]
