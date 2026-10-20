from __future__ import annotations
import typing
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .policy_status import PolicyStatus
from .money import Money
from .coverage import Coverage
from .insured_vehicle import InsuredVehicle
from .driver import Driver

PolicyDetailProduct = typing.Union[
    typing.Literal["personal_auto", "commercial_auto", "motorcycle", "classic_car"],
    typing.Any,
]

PolicyDetailBillingFrequency = typing.Union[
    typing.Literal["monthly", "quarterly", "semiannual", "annual"], typing.Any
]


class PolicyDetail(BaseModel):
    """PolicyDetail

    :param id: id
    :type id: str
    :param policy_number: policy_number
    :type policy_number: str
    :param customer_id: customer_id
    :type customer_id: str
    :param product: product
    :type product: PolicyDetailProduct
    :param status: status
    :type status: PolicyStatus
    :param effective_date: effective_date
    :type effective_date: str
    :param expiration_date: expiration_date
    :type expiration_date: str
    :param premium: premium, defaults to None
    :type premium: Money, optional
    :param billing_frequency: billing_frequency, defaults to None
    :type billing_frequency: PolicyDetailBillingFrequency, optional
    :param coverages: coverages, defaults to None
    :type coverages: List[Coverage], optional
    :param vehicles: vehicles, defaults to None
    :type vehicles: List[InsuredVehicle], optional
    :param drivers: drivers, defaults to None
    :type drivers: List[Driver], optional
    """

    id: str
    policy_number: str = Field(alias="policyNumber", serialization_alias="policyNumber")
    customer_id: str = Field(alias="customerId", serialization_alias="customerId")
    product: PolicyDetailProduct
    status: PolicyStatus
    effective_date: str = Field(
        alias="effectiveDate", serialization_alias="effectiveDate"
    )
    expiration_date: str = Field(
        alias="expirationDate", serialization_alias="expirationDate"
    )
    premium: Optional[Money] = Field(default=None)
    billing_frequency: Optional[PolicyDetailBillingFrequency] = Field(
        alias="billingFrequency", serialization_alias="billingFrequency", default=None
    )
    coverages: Optional[List[Coverage]] = Field(default=None)
    vehicles: Optional[List[InsuredVehicle]] = Field(default=None)
    drivers: Optional[List[Driver]] = Field(default=None)
