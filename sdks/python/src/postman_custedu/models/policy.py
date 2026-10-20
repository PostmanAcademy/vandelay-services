from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .policy_status import PolicyStatus
from .money import Money

PolicyProduct = typing.Union[
    typing.Literal["personal_auto", "commercial_auto", "motorcycle", "classic_car"],
    typing.Any,
]

PolicyBillingFrequency = typing.Union[
    typing.Literal["monthly", "quarterly", "semiannual", "annual"], typing.Any
]


class Policy(BaseModel):
    """Policy

    :param id: id
    :type id: str
    :param policy_number: policy_number
    :type policy_number: str
    :param customer_id: customer_id
    :type customer_id: str
    :param product: product
    :type product: PolicyProduct
    :param status: status
    :type status: PolicyStatus
    :param effective_date: effective_date
    :type effective_date: str
    :param expiration_date: expiration_date
    :type expiration_date: str
    :param premium: premium, defaults to None
    :type premium: Money, optional
    :param billing_frequency: billing_frequency, defaults to None
    :type billing_frequency: PolicyBillingFrequency, optional
    """

    id: str
    policy_number: str = Field(alias="policyNumber", serialization_alias="policyNumber")
    customer_id: str = Field(alias="customerId", serialization_alias="customerId")
    product: PolicyProduct
    status: PolicyStatus
    effective_date: str = Field(
        alias="effectiveDate", serialization_alias="effectiveDate"
    )
    expiration_date: str = Field(
        alias="expirationDate", serialization_alias="expirationDate"
    )
    premium: Optional[Money] = Field(default=None)
    billing_frequency: Optional[PolicyBillingFrequency] = Field(
        alias="billingFrequency", serialization_alias="billingFrequency", default=None
    )
