from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

AssignmentCreateRole = typing.Union[
    typing.Literal["tow", "repair", "rental", "appraisal", "glass"], typing.Any
]


class AssignmentCreate(BaseModel):
    """AssignmentCreate

    :param vendor_id: vendor_id
    :type vendor_id: str
    :param role: role
    :type role: AssignmentCreateRole
    :param scheduled_for: scheduled_for, defaults to None
    :type scheduled_for: str, optional
    :param instructions: instructions, defaults to None
    :type instructions: str, optional
    """

    vendor_id: str = Field(alias="vendorId", serialization_alias="vendorId")
    role: AssignmentCreateRole
    scheduled_for: Optional[str] = Field(
        alias="scheduledFor", serialization_alias="scheduledFor", default=None
    )
    instructions: Optional[str] = Field(default=None)
