from __future__ import annotations
from typing import List
from pydantic import Field
from typing import Optional
from typing import Any
from .utils.base_error import BaseError
from .utils.base_model import BaseModel


class ProblemErrorsItem(BaseModel):
    """ProblemErrorsItem

    :param field: field, defaults to None
    :type field: str, optional
    :param message: message, defaults to None
    :type message: str, optional
    """

    field: Optional[str] = Field(default=None)
    message: Optional[str] = Field(default=None)


# Pydantic validation model for Problem
class ProblemData(BaseModel):
    """Problem

    :param type: type
    :type type: str
    :param title: title
    :type title: str
    :param status: status
    :type status: int
    :param detail: detail, defaults to None
    :type detail: str, optional
    :param errors: errors, defaults to None
    :type errors: List[ProblemErrorsItem], optional
    :param trace_id: trace_id, defaults to None
    :type trace_id: str, optional
    """

    type: str
    title: str
    status: int
    detail: Optional[str] = Field(default=None)
    errors: Optional[List[ProblemErrorsItem]] = Field(default=None)
    trace_id: Optional[str] = Field(
        alias="traceId", serialization_alias="traceId", default=None
    )


# Error exception class
class Problem(BaseError):
    """Problem

    :param type: type
    :type type: str
    :param title: title
    :type title: str
    :param status: status
    :type status: int
    :param detail: detail, defaults to None
    :type detail: str, optional
    :param errors: errors, defaults to None
    :type errors: List[ProblemErrorsItem], optional
    :param trace_id: trace_id, defaults to None
    :type trace_id: str, optional
    """

    _model_class = ProblemData
