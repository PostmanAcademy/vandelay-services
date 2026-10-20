from __future__ import annotations
import typing
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel

PayeeType = typing.Union[typing.Literal["customer", "vendor"], typing.Any]


class Payee(BaseModel):
    """Payee

    :param type: type
    :type type: PayeeType
    :param id: id
    :type id: str
    """

    type: PayeeType
    id: str
