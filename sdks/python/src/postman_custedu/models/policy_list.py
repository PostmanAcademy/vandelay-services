from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from typing import Union
from .utils.base_model import BaseModel
from .policy import Policy


class PolicyList(BaseModel):
    """PolicyList

    :param data: data
    :type data: List[Policy]
    :param next_cursor: next_cursor, defaults to None
    :type next_cursor: str, optional
    """

    data: List[Policy]
    next_cursor: Optional[str] = Field(
        alias="nextCursor", serialization_alias="nextCursor", default=None
    )
