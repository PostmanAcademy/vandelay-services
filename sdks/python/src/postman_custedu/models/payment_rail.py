from __future__ import annotations
import typing
from typing import Any

PaymentRail = typing.Union[typing.Literal["ach", "check", "card", "wire"], typing.Any]
