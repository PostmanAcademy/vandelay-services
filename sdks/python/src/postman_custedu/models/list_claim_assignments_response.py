from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .assignment import Assignment


class ListClaimAssignmentsResponse(BaseModel):
    """ListClaimAssignmentsResponse

    :param data: data
    :type data: List[Assignment]
    """

    data: List[Assignment]
