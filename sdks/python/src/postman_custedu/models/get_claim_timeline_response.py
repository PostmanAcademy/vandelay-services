from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel
from .timeline_event import TimelineEvent


class GetClaimTimelineResponse(BaseModel):
    """GetClaimTimelineResponse

    :param data: data
    :type data: List[TimelineEvent]
    """

    data: List[TimelineEvent]
