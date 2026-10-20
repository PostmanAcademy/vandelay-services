from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .coverage import Coverage


class ListPolicyCoveragesResponse(BaseModel):
    """ListPolicyCoveragesResponse

    :param data: data
    :type data: List[Coverage]
    """

    data: List[Coverage]
