from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .vendor_type import VendorType
from .work_order_status import WorkOrderStatus
from .money import Money


class WorkOrder(BaseModel):
    """WorkOrder

    :param id: id
    :type id: str
    :param claim_id: claim_id
    :type claim_id: str
    :param vendor_id: vendor_id
    :type vendor_id: str
    :param type: type
    :type type: VendorType
    :param status: status
    :type status: WorkOrderStatus
    :param estimate: estimate, defaults to None
    :type estimate: Money, optional
    :param scheduled_for: scheduled_for, defaults to None
    :type scheduled_for: str, optional
    :param instructions: instructions, defaults to None
    :type instructions: str, optional
    :param notes: notes, defaults to None
    :type notes: str, optional
    :param created_at: created_at
    :type created_at: str
    :param updated_at: updated_at
    :type updated_at: str
    """

    id: str
    claim_id: str = Field(alias="claimId", serialization_alias="claimId")
    vendor_id: str = Field(alias="vendorId", serialization_alias="vendorId")
    type: VendorType
    status: WorkOrderStatus
    estimate: Optional[Money] = Field(default=None)
    scheduled_for: Optional[str] = Field(
        alias="scheduledFor", serialization_alias="scheduledFor", default=None
    )
    instructions: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    created_at: str = Field(alias="createdAt", serialization_alias="createdAt")
    updated_at: str = Field(alias="updatedAt", serialization_alias="updatedAt")
