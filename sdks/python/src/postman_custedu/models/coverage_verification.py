from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .coverage import Coverage


class CoverageVerificationReasonsItem(BaseModel):
    """CoverageVerificationReasonsItem

    :param code: code, defaults to None
    :type code: str, optional
    :param message: message, defaults to None
    :type message: str, optional
    """

    code: Optional[str] = Field(default=None)
    message: Optional[str] = Field(default=None)


class CoverageVerification(BaseModel):
    """CoverageVerification

    :param covered: covered
    :type covered: bool
    :param policy_id: policy_id
    :type policy_id: str
    :param loss_date: loss_date
    :type loss_date: str
    :param coverage: coverage, defaults to None
    :type coverage: Coverage, optional
    :param reasons: reasons, defaults to None
    :type reasons: List[CoverageVerificationReasonsItem], optional
    :param verified_at: verified_at
    :type verified_at: str
    """

    covered: bool
    policy_id: str = Field(alias="policyId", serialization_alias="policyId")
    loss_date: str = Field(alias="lossDate", serialization_alias="lossDate")
    coverage: Optional[Coverage] = Field(default=None)
    reasons: Optional[List[CoverageVerificationReasonsItem]] = Field(default=None)
    verified_at: str = Field(alias="verifiedAt", serialization_alias="verifiedAt")
