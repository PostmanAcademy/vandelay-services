from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from typing import Union
from .utils.base_model import BaseModel
from .claim_status import ClaimStatus
from .claim_type import ClaimType
from .address import Address
from .money import Money


class Claim(BaseModel):
    """Claim

    :param id: id
    :type id: str
    :param customer_id: customer_id
    :type customer_id: str
    :param policy_id: policy_id
    :type policy_id: str
    :param vehicle_id: vehicle_id, defaults to None
    :type vehicle_id: str, optional
    :param status: status
    :type status: ClaimStatus
    :param type: type
    :type type: ClaimType
    :param loss_date: loss_date
    :type loss_date: str
    :param loss_location: loss_location, defaults to None
    :type loss_location: Address, optional
    :param description: description, defaults to None
    :type description: str, optional
    :param drivable: drivable, defaults to None
    :type drivable: bool, optional
    :param injuries: injuries, defaults to None
    :type injuries: bool, optional
    :param police_report_number: police_report_number, defaults to None
    :type police_report_number: str, optional
    :param estimated_amount: estimated_amount, defaults to None
    :type estimated_amount: Money, optional
    :param deductible: deductible, defaults to None
    :type deductible: Money, optional
    :param assigned_adjuster_id: assigned_adjuster_id, defaults to None
    :type assigned_adjuster_id: str, optional
    :param created_at: created_at
    :type created_at: str
    :param updated_at: updated_at
    :type updated_at: str
    """

    id: str
    customer_id: str = Field(alias="customerId", serialization_alias="customerId")
    policy_id: str = Field(alias="policyId", serialization_alias="policyId")
    vehicle_id: Optional[str] = Field(
        alias="vehicleId", serialization_alias="vehicleId", default=None
    )
    status: ClaimStatus
    type: ClaimType
    loss_date: str = Field(alias="lossDate", serialization_alias="lossDate")
    loss_location: Optional[Address] = Field(
        alias="lossLocation", serialization_alias="lossLocation", default=None
    )
    description: Optional[str] = Field(default=None)
    drivable: Optional[bool] = Field(default=None)
    injuries: Optional[bool] = Field(default=None)
    police_report_number: Optional[str] = Field(
        alias="policeReportNumber",
        serialization_alias="policeReportNumber",
        default=None,
    )
    estimated_amount: Optional[Money] = Field(
        alias="estimatedAmount", serialization_alias="estimatedAmount", default=None
    )
    deductible: Optional[Money] = Field(default=None)
    assigned_adjuster_id: Optional[str] = Field(
        alias="assignedAdjusterId",
        serialization_alias="assignedAdjusterId",
        default=None,
    )
    created_at: str = Field(alias="createdAt", serialization_alias="createdAt")
    updated_at: str = Field(alias="updatedAt", serialization_alias="updatedAt")
