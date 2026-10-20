from __future__ import annotations
import typing
from typing import Any

ClaimStatus = typing.Union[
    typing.Literal[
        "draft",
        "submitted",
        "under_review",
        "approved",
        "denied",
        "settled",
        "closed",
        "cancelled",
    ],
    typing.Any,
]
