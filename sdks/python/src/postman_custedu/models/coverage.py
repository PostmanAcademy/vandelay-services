from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .money import Money


class Coverage(BaseModel):
    """Coverage

    :param code: code
    :type code: str
    :param name: name
    :type name: str
    :param limit: limit, defaults to None
    :type limit: Money, optional
    :param deductible: deductible, defaults to None
    :type deductible: Money, optional
    :param daily_limit: daily_limit, defaults to None
    :type daily_limit: Money, optional
    """

    code: str
    name: str
    limit: Optional[Money] = Field(default=None)
    deductible: Optional[Money] = Field(default=None)
    daily_limit: Optional[Money] = Field(
        alias="dailyLimit", serialization_alias="dailyLimit", default=None
    )
