from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .vendor_type import VendorType


class WorkOrderCreate(BaseModel):
    """WorkOrderCreate

    :param claim_id: claim_id
    :type claim_id: str
    :param vendor_id: vendor_id
    :type vendor_id: str
    :param type: type
    :type type: VendorType
    :param scheduled_for: scheduled_for, defaults to None
    :type scheduled_for: str, optional
    :param instructions: instructions, defaults to None
    :type instructions: str, optional
    """

    claim_id: str = Field(alias="claimId", serialization_alias="claimId")
    vendor_id: str = Field(alias="vendorId", serialization_alias="vendorId")
    type: VendorType
    scheduled_for: Optional[str] = Field(
        alias="scheduledFor", serialization_alias="scheduledFor", default=None
    )
    instructions: Optional[str] = Field(default=None)
