from __future__ import annotations
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_model import BaseModel


class TimelineEventActor(BaseModel):
    """TimelineEventActor

    :param type: type, defaults to None
    :type type: str, optional
    :param id: id, defaults to None
    :type id: str, optional
    """

    type: Optional[str] = Field(default=None)
    id: Optional[str] = Field(default=None)


class TimelineEvent(BaseModel):
    """TimelineEvent

    :param at: at
    :type at: str
    :param event: event
    :type event: str
    :param actor: actor, defaults to None
    :type actor: TimelineEventActor, optional
    :param summary: summary
    :type summary: str
    """

    at: str
    event: str
    actor: Optional[TimelineEventActor] = Field(default=None)
    summary: str
