from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from typing import Union
from .utils.base_model import BaseModel
from .work_order import WorkOrder


class ListWorkOrdersResponse(BaseModel):
    """ListWorkOrdersResponse

    :param data: data
    :type data: List[WorkOrder]
    :param next_cursor: next_cursor, defaults to None
    :type next_cursor: str, optional
    """

    data: List[WorkOrder]
    next_cursor: Optional[str] = Field(
        alias="nextCursor", serialization_alias="nextCursor", default=None
    )
