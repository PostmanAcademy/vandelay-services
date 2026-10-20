from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .claim_status import ClaimStatus
from .money import Money


class ClaimUpdate(BaseModel):
    """ClaimUpdate

    :param status: status, defaults to None
    :type status: ClaimStatus, optional
    :param description: description, defaults to None
    :type description: str, optional
    :param assigned_adjuster_id: assigned_adjuster_id, defaults to None
    :type assigned_adjuster_id: str, optional
    :param estimated_amount: estimated_amount, defaults to None
    :type estimated_amount: Money, optional
    """

    status: Optional[ClaimStatus] = Field(default=None)
    description: Optional[str] = Field(default=None)
    assigned_adjuster_id: Optional[str] = Field(
        alias="assignedAdjusterId",
        serialization_alias="assignedAdjusterId",
        default=None,
    )
    estimated_amount: Optional[Money] = Field(
        alias="estimatedAmount", serialization_alias="estimatedAmount", default=None
    )
