from __future__ import annotations
import typing
from typing import Any

PaymentStatus = typing.Union[
    typing.Literal[
        "pending_approval", "processing", "completed", "failed", "cancelled", "refunded"
    ],
    typing.Any,
]
