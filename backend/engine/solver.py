from __future__ import annotations

import random
from typing import Dict, List, Optional, Tuple

from emulator.ledger_types import AllianceOutcome, AllianceResult
from engine.alliance_parameters import AllianceParameters
from engine.game_parameters import GameParameters
from engine.constants import BELL_NUMBERS
from engine.partition_types import PartitionEvaluation, PartitionRejectReason


def _bell(n: int) -> int:
    if 0 <= n < len(BELL_NUMBERS):
        return BELL_NUMBERS[n]
    return -1


def _coerce_previous_partition(
    current_alliances: Optional[List[List[str]]],
    players: List[str],
) -> List[List[str]]:
    if not current_alliances:
        return [[p] for p in players]

    placed: set = set()
    groups: List[List[str]] = []

    for entry in current_alliances:
        members = [m for m in entry if m in players and m not in placed]
        if members:
            groups.append(members)
            placed.update(members)

    for p in players:
        if p not in placed:
            groups.append([p])

    return groups


class StrategicMilitarySim:
    def __init__(
        self,
        countries: Dict[str, int],
        previous_partition: Optional[List[List[str]]] = None,
        parameters: AllianceParameters | None = None,
        game_parameters: GameParameters | None = None,
        castle_ledger: Dict[str, List[int]] | None = None,
        rival_ledger: Dict[str, List[str]] | None = None,
        verbose: bool = False,
    ) -> None:
        params = parameters or AllianceParameters()
        self.game_parameters = game_parameters or GameParameters()
        self.castle_ledger = castle_ledger or {}
        self.rival_ledger = rival_ledger or {}
        self.countries = countries
        self.players = list(countries.keys())
        self.ratio_limit = params.ratio_limit
        self.alpha = params.alpha
        self.beta = params.beta
        self.epsilon_fraction = params.epsilon_fraction
        self.strategy = params.strategy
        self.total_power = sum(countries.values())
        self.previous_partition = previous_partition
        self.verbose = verbose
        self.stats: Dict[str, int] = {
            "evaluated": 0,
            "valid": 0,
            "single_pole": 0,
            "rival": 0,
            "imbalance": 0,
            "exploited": 0,
        }

    def _all_partitions(self, collection: List[str]):
        if len(collection) == 1:
            yield [collection]
            return
        first = collection[0]
        for smaller in self._all_partitions(collection[1:]):
            for i, subset in enumerate(smaller):
                yield smaller[:i] + [[first] + subset] + smaller[i + 1 :]
            yield [[first]] + smaller

    def _max_min_power_ratio(self, partition: List[List[str]]) -> float:
        """Strongest alliance ATTACK divided by weakest alliance DEFENSE.
        Attack = raw troops. Defense = troops + castle bonuses.
        A partition is imbalanced when the top attacker can overwhelm the weakest defender.
        """
        attacks = [self.get_alliance_attack_power(a) for a in partition]
        defenses = [self.get_alliance_defense_power(a) for a in partition]
        return max(attacks) / max(min(defenses), 1)

    def _is_power_imbalanced(self, partition: List[List[str]]) -> Tuple[bool, float]:
        ratio = self._max_min_power_ratio(partition)
        return ratio > self.ratio_limit, ratio

    def _record_reject(self, reason: PartitionRejectReason) -> None:
        self.stats[reason.value] += 1

    def _alliance_has_internal_rival(self, alliance: List[str]) -> Optional[str]:
        if len(alliance) < 2:
            return None
        members = set(alliance)
        for country in alliance:
            for rival in self.rival_ledger.get(country, []):
                if rival in members:
                    return f"{country} rivals {rival}"
        return None

    def evaluate_stability(self, partition: List[List[str]]) -> PartitionEvaluation:
        num_alliances = len(partition)
        if num_alliances < 2:
            self._record_reject(PartitionRejectReason.SINGLE_POLE)
            return PartitionEvaluation.rejected(PartitionRejectReason.SINGLE_POLE)

        for alliance in partition:
            rival_detail = self._alliance_has_internal_rival(alliance)
            if rival_detail:
                self._record_reject(PartitionRejectReason.RIVAL)
                return PartitionEvaluation.rejected(
                    PartitionRejectReason.RIVAL,
                    detail=rival_detail,
                )

        imbalanced, ratio = self._is_power_imbalanced(partition)
        if imbalanced:
            self._record_reject(PartitionRejectReason.IMBALANCE)
            return PartitionEvaluation.rejected(
                PartitionRejectReason.IMBALANCE,
                detail=f"{ratio:.2f}x > {self.ratio_limit:.2f}x",
            )

        for alliance in partition:
            payoff = self.get_alliance_worth(alliance)

            for country in alliance:
                # v_solo = troops + country's OWN castle defense
                # Castles protect solo too — they're fortifications, not gifts to allies
                v_solo = self.get_solo_power(country)
                epsilon_i = self.epsilon_fraction * v_solo

                active_epsilon = 0.0
                if self.previous_partition:
                    old_alln = next(
                        (p for p in self.previous_partition if country in p), None
                    )
                    if old_alln != alliance:
                        active_epsilon = epsilon_i

                if payoff + active_epsilon < v_solo:
                    self._record_reject(PartitionRejectReason.EXPLOITED)
                    return PartitionEvaluation.rejected(
                        PartitionRejectReason.EXPLOITED,
                        detail=(
                            f"{country}: payoff={payoff:.0f}"
                            f"+eps={active_epsilon:.0f} < solo={v_solo}"
                        ),
                    )

        balance_penalty = (ratio - 1.0) * 100
        self.stats["valid"] += 1
        return PartitionEvaluation.valid(balance_penalty)

    def fee(self, S: List[str]) -> float:
        k = len(S)
        if k <= 1:
            return 0.0
        return self.alpha * self.get_alliance_power(S) * ((k - 1) ** self.beta)

    def find_best_outcome(self) -> Tuple[Optional[List[List[str]]], float]:
        valid_partitions: List[Tuple[List[List[str]], float]] = []

        for partition in self._all_partitions(self.players):
            self.stats["evaluated"] += 1
            evaluation = self.evaluate_stability(partition)

            if evaluation.is_valid:
                if self.verbose:
                    print(
                        f"[SOLVER-ECORE] Valid partition={partition} "
                        f"score={evaluation.score:.2f}"
                    )
                valid_partitions.append((partition, evaluation.score))
            elif self.verbose:
                print(
                    f"[SOLVER-ECORE] Rejected partition={partition} "
                    f'reason="{evaluation.log_message}"'
                )

        if not valid_partitions:
            return None, float("inf")

        if self.strategy == "unbalanced":
            # Select the partition with the maximum balance penalty score
            best_scenario, max_score = max(valid_partitions, key=lambda x: x[1])
            return best_scenario, max_score
        elif self.strategy == "random":
            # Select a random valid partition deterministically using a seed derived
            # from self.players and self.total_power, which are identical across all mining nodes.
            import hashlib
            seed_material = f"{sorted(self.players)}-{self.total_power}"
            seed_int = int(hashlib.sha256(seed_material.encode()).hexdigest(), 16)
            rng = random.Random(seed_int)
            best_scenario, random_score = rng.choice(valid_partitions)
            return best_scenario, random_score
        else: # "balanced"
            # Select the partition with the minimum balance penalty score
            best_scenario, min_score = min(valid_partitions, key=lambda x: x[1])
            return best_scenario, min_score

    def get_castle_bonus(self, country: str) -> int:
        """Total castle defense bonus for a single country."""
        bonus = 0
        for level in self.castle_ledger.get(country, []):
            bonus += self.game_parameters.castles[level].defense
        return bonus

    def get_solo_power(self, country: str) -> int:
        """Solo DEFENSE power: troops + own castle fortifications.
        This is what a country can resist when standing alone."""
        return self.countries[country] + self.get_castle_bonus(country)

    def get_alliance_attack_power(self, alliance: List[str]) -> int:
        """Alliance ATTACK power = raw troops of all members.
        Castles do not contribute offensively — they are fortifications, not weapons."""
        return sum(self.countries[c] for c in alliance)

    def get_alliance_defense_power(self, alliance: List[str]) -> int:
        """Alliance DEFENSE power = troops + castle bonuses of all members.
        When attacked, the whole alliance defends from behind its fortifications."""
        return sum(self.countries[c] + self.get_castle_bonus(c) for c in alliance)

    def get_alliance_power(self, alliance: List[str]) -> int:
        """Alias for attack power — used by fee formula and worth calculation.
        Fee is based on offensive coordination cost, not defensive capacity."""
        return self.get_alliance_attack_power(alliance)

    def get_alliance_worth(self, S: List[str]) -> float:
        if not S:
            return 0.0
        if len(S) == 1:
            # Solo: country uses its castles for defense
            return float(self.get_solo_power(S[0]))
        return self.get_alliance_attack_power(S) - self.fee(S)

    # --- HAPPY_WORLD (disabled) ---
    # def grand_coalition_is_individually_rational(self) -> bool:
    #     """
    #     True when every country prefers the grand coalition over going solo.
    #     Used for the optional HAPPY_WORLD terminal outcome (not active yet).
    #     """
    #     grand = self.players
    #     payoff = self.get_alliance_worth(grand)
    #     for country in grand:
    #         v_solo = self.countries[country]
    #         epsilon_i = self.epsilon_fraction * v_solo
    #         if payoff < v_solo - epsilon_i:
    #             return False
    #     return True


def calculate_alliances(
    troop_ledger: Dict[str, int],
    castle_ledger: Dict[str, List[int]],
    rival_ledger: Dict[str, List[str]],
    current_alliances: Optional[List[List[str]]],
    parameters: AllianceParameters,
    game_parameters: GameParameters,
) -> AllianceResult:
    if not troop_ledger:
        raise ValueError("Troop ledger must not be empty when calculating alliances")

    players = list(troop_ledger.keys())
    countries = {c: int(troop_ledger[c]) for c in players}
    global_power = sum(countries.values())

    print(
        f"[SOLVER-ECORE] Inputs: players={players} "
        f"global_power={global_power} previous_partition={current_alliances or []}"
    )

    if global_power <= 0:
        print("[SOLVER-ECORE] Global power is zero; no meaningful alliances possible.")
        return AllianceResult(
            alliances=[],
            stability_score=None,
            outcome=AllianceOutcome.NO_STABLE_PARTITION,
        )

    previous_partition = _coerce_previous_partition(current_alliances, players)
    print(f"[SOLVER-ECORE] Normalized previous_partition={previous_partition}")

    n = len(players)
    bell = _bell(n)
    bell_str = f"~{bell:,}" if bell > 0 else "huge number of"
    print(
        f"[SOLVER-ECORE] Enumerating set partitions of {n} players ({bell_str} scenarios). "
        f"ratio_limit={parameters.ratio_limit}x alpha={parameters.alpha} beta={parameters.beta} "
        f"epsilon_fraction={parameters.epsilon_fraction}"
    )

    sim = StrategicMilitarySim(
        countries,
        previous_partition=previous_partition,
        parameters=parameters,
        game_parameters=game_parameters,
        castle_ledger=castle_ledger,
        rival_ledger=rival_ledger,
        verbose=False,
    )
    best, score = sim.find_best_outcome()

    stats = sim.stats
    print(
        f"[SOLVER-ECORE] Search complete: evaluated={stats['evaluated']} "
        f"valid={stats['valid']} single_pole={stats['single_pole']} "
        f"rival={stats['rival']} imbalance={stats['imbalance']} "
        f"exploited={stats['exploited']}"
    )

    if best is None:
        # --- HAPPY_WORLD (disabled) ---
        # if sim.grand_coalition_is_individually_rational():
        #     print(
        #         "[SOLVER-ECORE] HAPPY WORLD: grand coalition is individually rational. "
        #         "All countries prefer unity."
        #     )
        #     return AllianceResult(
        #         alliances=[sorted(players)],
        #         stability_score=0.0,
        #         outcome=AllianceOutcome.HAPPY_WORLD,
        #     )

        print(
            "[SOLVER-ECORE] WORLD WAR 3: no stable partition found. "
            "Returning empty alliances with NO_STABLE_PARTITION outcome."
        )
        return AllianceResult(
            alliances=[],
            stability_score=None,
            outcome=AllianceOutcome.NO_STABLE_PARTITION,
        )

    power_blocks = [(sorted(group), sim.get_alliance_power(group)) for group in best]
    ratio = sim._max_min_power_ratio(best)
    print(
        f"[SOLVER-ECORE] Best partition={[g for g, _ in power_blocks]} "
        f"score={score:.2f} power_blocks={power_blocks} max_min_ratio={ratio:.2f}"
    )

    alliances = sorted(
        [sorted(group) for group in best if len(group) >= 2],
        key=lambda g: (-sim.get_alliance_power(g), g[0] if g else ""),
    )

    return AllianceResult(
        alliances=alliances,
        stability_score=float(score),
        outcome=AllianceOutcome.STABLE,
    )
