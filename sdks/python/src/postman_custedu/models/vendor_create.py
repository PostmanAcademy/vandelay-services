from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .vendor_type import VendorType
from .address import Address


class VendorCreate(BaseModel):
    """VendorCreate

    :param name: name
    :type name: str
    :param type: type
    :type type: VendorType
    :param tax_id: tax_id, defaults to None
    :type tax_id: str, optional
    :param phone: phone
    :type phone: str
    :param email: email
    :type email: str
    :param address: address
    :type address: Address
    :param service_area_postal_codes: service_area_postal_codes, defaults to None
    :type service_area_postal_codes: List[str], optional
    :param in_network: in_network, defaults to None
    :type in_network: bool, optional
    """

    name: str
    type: VendorType
    tax_id: Optional[str] = Field(
        alias="taxId", serialization_alias="taxId", default=None
    )
    phone: str
    email: str
    address: Address
    service_area_postal_codes: Optional[List[str]] = Field(
        alias="serviceAreaPostalCodes",
        serialization_alias="serviceAreaPostalCodes",
        default=None,
    )
    in_network: Optional[bool] = Field(
        alias="inNetwork", serialization_alias="inNetwork", default=None
    )
