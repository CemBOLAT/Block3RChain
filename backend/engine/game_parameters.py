from pydantic import BaseModel


class GameParameters(BaseModel):
    block_reward: int = 1000

    # Level 1 Castle
    castle_build_cost_l1: int = 2000
    castle_maintenance_l1: int = 1000
    castle_defense_l1: int = 10000

    # Level 2 Castle
    castle_build_cost_l2: int = 5000
    castle_maintenance_l2: int = 2000
    castle_defense_l2: int = 25000

    # Level 3 Castle
    castle_build_cost_l3: int = 10000
    castle_maintenance_l3: int = 5000
    castle_defense_l3: int = 50000
