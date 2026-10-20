from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

NoteCreateVisibility = typing.Union[typing.Literal["internal", "customer"], typing.Any]


class NoteCreate(BaseModel):
    """NoteCreate

    :param visibility: visibility, defaults to None
    :type visibility: NoteCreateVisibility, optional
    :param body: body
    :type body: str
    """

    visibility: Optional[NoteCreateVisibility] = Field(default=None)
    body: str
