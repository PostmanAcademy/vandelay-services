from __future__ import annotations
import typing
from typing import Any

ClaimType = typing.Union[
    typing.Literal[
        "collision",
        "comprehensive",
        "theft",
        "glass",
        "vandalism",
        "weather",
        "liability",
        "other",
    ],
    typing.Any,
]
