from pydantic import BaseModel

from engine.constants import (
    DEFAULT_ALPHA,
    DEFAULT_BETA,
    DEFAULT_EPSILON_FRACTION,
    DEFAULT_RATIO_LIMIT,
)


class AllianceParameters(BaseModel):
    ratio_limit: float = DEFAULT_RATIO_LIMIT
    alpha: float = DEFAULT_ALPHA
    beta: float = DEFAULT_BETA
    epsilon_fraction: float = DEFAULT_EPSILON_FRACTION
