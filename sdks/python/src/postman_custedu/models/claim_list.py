from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from typing import Union
from .utils.base_model import BaseModel
from .claim import Claim


class ClaimList(BaseModel):
    """ClaimList

    :param data: data
    :type data: List[Claim]
    :param next_cursor: next_cursor, defaults to None
    :type next_cursor: str, optional
    """

    data: List[Claim]
    next_cursor: Optional[str] = Field(
        alias="nextCursor", serialization_alias="nextCursor", default=None
    )
