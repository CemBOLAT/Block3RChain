from pydantic import BaseModel, Field


class CastleParameters(BaseModel):
    build_cost: int
    maintenance: int
    defense: int


DEFAULT_CASTLES: dict[int, CastleParameters] = {
    1: CastleParameters(build_cost=2000, maintenance=1000, defense=10000),
    2: CastleParameters(build_cost=5000, maintenance=2000, defense=25000),
    3: CastleParameters(build_cost=10000, maintenance=5000, defense=50000),
}


class GameParameters(BaseModel):
    block_reward: int = 1000
    castles: dict[int, CastleParameters] = Field(default_factory=lambda: dict(DEFAULT_CASTLES))
    happiness_limit: int = 30
    emigration_rate_per_block: float = Field(default=0.02, ge=0.0, le=1.0)
