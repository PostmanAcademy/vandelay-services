from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .work_order_status import WorkOrderStatus
from .money import Money


class WorkOrderUpdate(BaseModel):
    """WorkOrderUpdate

    :param status: status, defaults to None
    :type status: WorkOrderStatus, optional
    :param estimate: estimate, defaults to None
    :type estimate: Money, optional
    :param scheduled_for: scheduled_for, defaults to None
    :type scheduled_for: str, optional
    :param notes: notes, defaults to None
    :type notes: str, optional
    """

    status: Optional[WorkOrderStatus] = Field(default=None)
    estimate: Optional[Money] = Field(default=None)
    scheduled_for: Optional[str] = Field(
        alias="scheduledFor", serialization_alias="scheduledFor", default=None
    )
    notes: Optional[str] = Field(default=None)
