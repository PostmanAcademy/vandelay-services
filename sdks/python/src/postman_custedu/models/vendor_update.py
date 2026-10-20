from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

VendorUpdateStatus = typing.Union[
    typing.Literal["active", "suspended", "terminated"], typing.Any
]


class VendorUpdate(BaseModel):
    """VendorUpdate

    :param name: name, defaults to None
    :type name: str, optional
    :param phone: phone, defaults to None
    :type phone: str, optional
    :param email: email, defaults to None
    :type email: str, optional
    :param in_network: in_network, defaults to None
    :type in_network: bool, optional
    :param status: status, defaults to None
    :type status: VendorUpdateStatus, optional
    """

    name: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    in_network: Optional[bool] = Field(
        alias="inNetwork", serialization_alias="inNetwork", default=None
    )
    status: Optional[VendorUpdateStatus] = Field(default=None)
