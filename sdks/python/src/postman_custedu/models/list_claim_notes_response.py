from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .note import Note


class ListClaimNotesResponse(BaseModel):
    """ListClaimNotesResponse

    :param data: data
    :type data: List[Note]
    """

    data: List[Note]
