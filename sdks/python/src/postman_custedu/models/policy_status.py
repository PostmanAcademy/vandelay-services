from __future__ import annotations
import typing
from typing import Any

PolicyStatus = typing.Union[
    typing.Literal["quoted", "active", "lapsed", "cancelled", "expired"], typing.Any
]
