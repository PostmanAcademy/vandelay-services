from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

PreferencesContactMethod = typing.Union[
    typing.Literal["sms", "email", "phone", "app"], typing.Any
]


class Preferences(BaseModel):
    """Preferences

    :param contact_method: contact_method, defaults to None
    :type contact_method: PreferencesContactMethod, optional
    :param language: language, defaults to None
    :type language: str, optional
    :param marketing_opt_in: marketing_opt_in, defaults to None
    :type marketing_opt_in: bool, optional
    """

    contact_method: Optional[PreferencesContactMethod] = Field(
        alias="contactMethod", serialization_alias="contactMethod", default=None
    )
    language: Optional[str] = Field(default=None)
    marketing_opt_in: Optional[bool] = Field(
        alias="marketingOptIn", serialization_alias="marketingOptIn", default=None
    )
