from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

CoverageVerificationRequestClaimType = typing.Union[
    typing.Literal[
        "collision",
        "comprehensive",
        "theft",
        "glass",
        "vandalism",
        "weather",
        "liability",
        "other",
    ],
    typing.Any,
]


class CoverageVerificationRequest(BaseModel):
    """CoverageVerificationRequest

    :param loss_date: loss_date
    :type loss_date: str
    :param claim_type: claim_type
    :type claim_type: CoverageVerificationRequestClaimType
    :param vehicle_id: vehicle_id, defaults to None
    :type vehicle_id: str, optional
    :param driver_id: driver_id, defaults to None
    :type driver_id: str, optional
    """

    loss_date: str = Field(alias="lossDate", serialization_alias="lossDate")
    claim_type: CoverageVerificationRequestClaimType = Field(
        alias="claimType", serialization_alias="claimType"
    )
    vehicle_id: Optional[str] = Field(
        alias="vehicleId", serialization_alias="vehicleId", default=None
    )
    driver_id: Optional[str] = Field(
        alias="driverId", serialization_alias="driverId", default=None
    )
