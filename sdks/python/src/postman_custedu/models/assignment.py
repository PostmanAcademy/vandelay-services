from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

AssignmentRole = typing.Union[
    typing.Literal["tow", "repair", "rental", "appraisal", "glass"], typing.Any
]

AssignmentStatus = typing.Union[
    typing.Literal[
        "requested", "accepted", "declined", "in_progress", "completed", "cancelled"
    ],
    typing.Any,
]


class Assignment(BaseModel):
    """Assignment

    :param id: id
    :type id: str
    :param claim_id: claim_id
    :type claim_id: str
    :param vendor_id: vendor_id
    :type vendor_id: str
    :param role: role
    :type role: AssignmentRole
    :param status: status
    :type status: AssignmentStatus
    :param scheduled_for: scheduled_for, defaults to None
    :type scheduled_for: str, optional
    :param created_at: created_at
    :type created_at: str
    """

    id: str
    claim_id: str = Field(alias="claimId", serialization_alias="claimId")
    vendor_id: str = Field(alias="vendorId", serialization_alias="vendorId")
    role: AssignmentRole
    status: AssignmentStatus
    scheduled_for: Optional[str] = Field(
        alias="scheduledFor", serialization_alias="scheduledFor", default=None
    )
    created_at: str = Field(alias="createdAt", serialization_alias="createdAt")
