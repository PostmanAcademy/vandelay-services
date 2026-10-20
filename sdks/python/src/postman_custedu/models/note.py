from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

NoteAuthorType = typing.Union[
    typing.Literal["customer", "adjuster", "vendor", "system"], typing.Any
]


class NoteAuthor(BaseModel):
    """NoteAuthor

    :param type: type
    :type type: NoteAuthorType
    :param id: id
    :type id: str
    """

    type: NoteAuthorType
    id: str


NoteVisibility = typing.Union[typing.Literal["internal", "customer"], typing.Any]


class Note(BaseModel):
    """Note

    :param id: id
    :type id: str
    :param author: author
    :type author: NoteAuthor
    :param visibility: visibility
    :type visibility: NoteVisibility
    :param body: body
    :type body: str
    :param created_at: created_at
    :type created_at: str
    """

    id: str
    author: NoteAuthor
    visibility: NoteVisibility
    body: str
    created_at: str = Field(alias="createdAt", serialization_alias="createdAt")
