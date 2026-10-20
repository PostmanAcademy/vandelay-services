from __future__ import annotations
import typing
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .vendor_type import VendorType
from .address import Address

VendorStatus = typing.Union[
    typing.Literal["pending", "active", "suspended", "terminated"], typing.Any
]


class Vendor(BaseModel):
    """Vendor

    :param id: id
    :type id: str
    :param name: name
    :type name: str
    :param type: type
    :type type: VendorType
    :param in_network: in_network, defaults to None
    :type in_network: bool, optional
    :param rating: rating, defaults to None
    :type rating: float, optional
    :param distance_miles: Present when searching by `postalCode`., defaults to None
    :type distance_miles: float, optional
    :param phone: phone, defaults to None
    :type phone: str, optional
    :param email: email, defaults to None
    :type email: str, optional
    :param address: address, defaults to None
    :type address: Address, optional
    :param service_area_postal_codes: service_area_postal_codes, defaults to None
    :type service_area_postal_codes: List[str], optional
    :param status: status
    :type status: VendorStatus
    :param created_at: created_at, defaults to None
    :type created_at: str, optional
    """

    id: str
    name: str
    type: VendorType
    in_network: Optional[bool] = Field(
        alias="inNetwork", serialization_alias="inNetwork", default=None
    )
    rating: Optional[float] = Field(default=None)
    distance_miles: Optional[float] = Field(
        alias="distanceMiles",
        serialization_alias="distanceMiles",
        default=None,
        description="Present when searching by `postalCode`.",
    )
    phone: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)
    address: Optional[Address] = Field(default=None)
    service_area_postal_codes: Optional[List[str]] = Field(
        alias="serviceAreaPostalCodes",
        serialization_alias="serviceAreaPostalCodes",
        default=None,
    )
    status: VendorStatus
    created_at: Optional[str] = Field(
        alias="createdAt", serialization_alias="createdAt", default=None
    )
