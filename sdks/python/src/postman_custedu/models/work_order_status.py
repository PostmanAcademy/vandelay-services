from __future__ import annotations
import typing
from typing import Any

WorkOrderStatus = typing.Union[
    typing.Literal[
        "issued", "accepted", "declined", "in_progress", "completed", "cancelled"
    ],
    typing.Any,
]
