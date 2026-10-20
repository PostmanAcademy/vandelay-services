from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .claim_type import ClaimType
from .address import Address


class ClaimCreate(BaseModel):
    """ClaimCreate

    :param customer_id: customer_id
    :type customer_id: str
    :param policy_id: policy_id
    :type policy_id: str
    :param vehicle_id: vehicle_id, defaults to None
    :type vehicle_id: str, optional
    :param type: type
    :type type: ClaimType
    :param loss_date: loss_date
    :type loss_date: str
    :param loss_location: loss_location, defaults to None
    :type loss_location: Address, optional
    :param description: description
    :type description: str
    :param drivable: drivable, defaults to None
    :type drivable: bool, optional
    :param injuries: injuries, defaults to None
    :type injuries: bool, optional
    :param police_report_number: police_report_number, defaults to None
    :type police_report_number: str, optional
    :param submit: If true, the claim is submitted immediately., defaults to None
    :type submit: bool, optional
    """

    customer_id: str = Field(alias="customerId", serialization_alias="customerId")
    policy_id: str = Field(alias="policyId", serialization_alias="policyId")
    vehicle_id: Optional[str] = Field(
        alias="vehicleId", serialization_alias="vehicleId", default=None
    )
    type: ClaimType
    loss_date: str = Field(alias="lossDate", serialization_alias="lossDate")
    loss_location: Optional[Address] = Field(
        alias="lossLocation", serialization_alias="lossLocation", default=None
    )
    description: str
    drivable: Optional[bool] = Field(default=None)
    injuries: Optional[bool] = Field(default=None)
    police_report_number: Optional[str] = Field(
        alias="policeReportNumber",
        serialization_alias="policeReportNumber",
        default=None,
    )
    submit: Optional[bool] = Field(
        default=None, description="If true, the claim is submitted immediately."
    )
