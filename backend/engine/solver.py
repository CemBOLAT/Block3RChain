"""Partition-based e-Core alliance solver.

Replaces the previous PyGambit pairwise solver. Each "scenario" is now a full
set partition of the players into N alliances. We score partitions with the
balance penalty (max/min alliance power ratio) and pick the lowest valid one.

Public entry point: ``calculate_alliances(troop_ledger, current_alliances)``.
"""

from __future__ import annotations
from typing import Dict, List, Optional, Tuple


_BELL_NUMBERS = [
    1, 1, 2, 5, 15, 52, 203, 877, 4140, 21147, 115975, 678570, 4213597,
    27644437, 190899322, 1382958545,
]


def _bell(n: int) -> int:
    if 0 <= n < len(_BELL_NUMBERS):
        return _BELL_NUMBERS[n]
    return -1


# Stability evaluation status constants. The status string is what
# ``evaluate_stability`` returns alongside the score; ``STATUS_VALID`` is the
# only one that lets a partition be considered for selection.
STATUS_VALID = "VALID"
STATUS_SINGLE_POLE = "PROHIBITED: single-pole (only one alliance)"
STATUS_IMBALANCE = "PROHIBITED: power imbalance over ratio_limit"
STATUS_HEGEMONY = "PROHIBITED: hegemony cap exceeded"
STATUS_EXPLOITED = "PROHIBITED: country exploited (share < solo power)"


class StrategicMilitarySim:
    """Brute-force e-Core search over all set partitions of ``countries``.

    The class is intentionally small and self-contained; the wrapper below adds
    project-specific concerns (logging, defaults, output formatting).
    """

    def __init__(
        self,
        countries: Dict[str, int],
        previous_partition: Optional[List[List[str]]] = None,
        ratio_limit: float = 1.5,
        epsilon: float = 40.0,
        verbose: bool = False,
    ) -> None:
        self.countries = countries
        self.players = list(countries.keys())
        self.ratio_limit = ratio_limit
        self.total_power = sum(countries.values())
        self.epsilon = epsilon
        self.previous_partition = previous_partition
        self.verbose = verbose
        self.stats: Dict[str, int] = {
            "evaluated": 0,
            "valid": 0,
            "single_pole": 0,
            "imbalance": 0,
            "hegemony": 0,
            "exploited": 0,
        }

    def get_alliance_power(self, alliance: List[str]) -> int:
        return sum(self.countries[c] for c in alliance)

    def get_v(self, S: List[str], num_alliances: int) -> int:
        if not S:
            return 0
        pwr = sum(self.countries[c] for c in S)
        cap = 0.6 if num_alliances == 2 else 0.5
        if pwr / self.total_power > cap:
            return 0
        return pwr

    def calculate_shapley_dependency(self, country: str, alliance: List[str]) -> int:
        """Marginal contribution: how much power leaves with this country."""
        n = len(alliance)
        if n <= 1:
            return self.countries[country]
        others = [c for c in alliance if c != country]
        return self.get_alliance_power(alliance) - self.get_alliance_power(others)

    def evaluate_stability(self, partition: List[List[str]]) -> Tuple[float, str]:
        num_alliances = len(partition)
        if num_alliances < 2:
            self.stats["single_pole"] += 1
            return float("inf"), STATUS_SINGLE_POLE

        alliance_powers = [self.get_alliance_power(a) for a in partition]
        ratio = max(alliance_powers) / min(alliance_powers)
        if ratio > self.ratio_limit:
            self.stats["imbalance"] += 1
            return (
                float("inf"),
                f"{STATUS_IMBALANCE} ({ratio:.2f}x > {self.ratio_limit:.2f}x)",
            )

        # --- Equal-share e-Core check ---
        for alliance in partition:
            total_v = self.get_v(alliance, num_alliances)
            if total_v == 0:
                self.stats["hegemony"] += 1
                pct = sum(self.countries[c] for c in alliance) / self.total_power
                return (
                    float("inf"),
                    f"{STATUS_HEGEMONY} ({sorted(alliance)} holds {pct:.0%})",
                )

            payout_per_country = total_v / len(alliance)

            for country in alliance:
                v_solo = self.countries[country]
                active_epsilon = 0.0
                if self.previous_partition:
                    old_alln = next(
                        (p for p in self.previous_partition if country in p), None
                    )
                    # Loyalty bonus only protects countries that stayed put.
                    if old_alln != alliance:
                        active_epsilon = self.epsilon

                # If even the equal share + loyalty cushion is less than the
                # country could earn on its own, this partition will not hold.
                if payout_per_country + active_epsilon < v_solo:
                    self.stats["exploited"] += 1
                    return (
                        float("inf"),
                        f"{STATUS_EXPLOITED} "
                        f"({country}: share={payout_per_country:.0f}"
                        f"+eps{active_epsilon:.0f} < solo={v_solo})",
                    )

        balance_penalty = (ratio - 1.0) * 100
        self.stats["valid"] += 1
        return balance_penalty, STATUS_VALID

    def find_best_outcome(self) -> Tuple[Optional[List[List[str]]], float]:
        best_scenario: Optional[List[List[str]]] = None
        min_score = float("inf")

        for partition in self._all_partitions(self.players):
            self.stats["evaluated"] += 1
            score, status = self.evaluate_stability(partition)

            if status == STATUS_VALID:
                if self.verbose:
                    print(
                        f"[SOLVER-ECORE] Valid partition={partition} score={score:.2f}"
                    )
                if score < min_score:
                    min_score = score
                    best_scenario = partition
            else:
                if self.verbose:
                    print(
                        f"[SOLVER-ECORE] Prohibited partition={partition} "
                        f"reason=\"{status}\""
                    )

        return best_scenario, min_score

    def _all_partitions(self, collection: List[str]):
        if len(collection) == 1:
            yield [collection]
            return
        first = collection[0]
        for smaller in self._all_partitions(collection[1:]):
            for i, subset in enumerate(smaller):
                yield smaller[:i] + [[first] + subset] + smaller[i + 1:]
            yield [[first]] + smaller


def _coerce_previous_partition(
    current_alliances: Optional[List[List[str]]],
    players: List[str],
) -> List[List[str]]:
    """Normalize ``current_alliances`` into a complete partition.

    Filters out unknown countries (e.g. one that was removed between blocks)
    and adds a singleton group for every player not already placed, so the
    result is a full partition over ``players`` as ``StrategicMilitarySim``
    requires.
    """
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


def calculate_alliances(
    troop_ledger: Dict[str, int],
    current_alliances: Optional[List[List[str]]] = None,
) -> Tuple[List[List[str]], Dict[str, int], Optional[float], str]:
    """Find the most balanced stable alliance partition for ``troop_ledger``.

    Returns ``(alliances, ledger_changes, stability_score, status)`` where:

    - ``alliances`` is a list of member lists (each with >= 2 countries).
      Singleton (solo) countries are omitted; clients can derive them from
      ``set(troop_ledger) - flatten(alliances)``.
    - ``ledger_changes`` is reserved for future economic effects. The new
      rule set has no escrow fee, so this is always ``{}``.
    - ``stability_score`` is ``(max/min - 1) * 100`` of the chosen partition's
      power blocks. Lower is more balanced. ``None`` on failure (the wire
      format is JSON which has no native infinity).
    - ``status`` is one of ``"STABLE"``, ``"NO_STABLE_PARTITION"``, ``"EMPTY_LEDGER"``.
    """
    if not troop_ledger:
        print("[SOLVER-ECORE] Empty ledger; returning EMPTY_LEDGER.")
        return [], {}, None, "EMPTY_LEDGER"

    players = list(troop_ledger.keys())
    countries = {c: int(troop_ledger[c]) for c in players}
    global_power = sum(countries.values())

    print(
        f"[SOLVER-ECORE] Inputs: players={players} "
        f"global_power={global_power} previous_partition={current_alliances or []}"
    )

    if global_power <= 0:
        print("[SOLVER-ECORE] Global power is zero; no meaningful alliances possible.")
        return [], {}, None, "NO_STABLE_PARTITION"

    previous_partition = _coerce_previous_partition(current_alliances, players)
    print(f"[SOLVER-ECORE] Normalized previous_partition={previous_partition}")

    n = len(players)
    bell = _bell(n)
    bell_str = f"~{bell:,}" if bell > 0 else "huge"
    print(
        f"[SOLVER-ECORE] Enumerating set partitions of {n} players ({bell_str} scenarios). "
        f"ratio_limit=1.5x epsilon=60.0"
    )
    if n > 12:
        print(
            f"[SOLVER-ECORE] WARNING: {n} players exceeds the practical brute-force "
            f"window (Bell({n})={bell_str}). The solve may take a long time. "
            f"Consider truncating in a future iteration."
        )

    sim = StrategicMilitarySim(
        countries,
        previous_partition=previous_partition,
        ratio_limit=1.5,
        epsilon=60.0,
        verbose=True,
    )
    best, score = sim.find_best_outcome()

    stats = sim.stats
    print(
        f"[SOLVER-ECORE] Search complete: evaluated={stats['evaluated']} "
        f"valid={stats['valid']} single_pole={stats['single_pole']} "
        f"imbalance={stats['imbalance']} hegemony={stats['hegemony']} "
        f"exploited={stats['exploited']}"
    )

    if best is None:
        print(
            "[SOLVER-ECORE] WORLD WAR 3: no stable partition found. "
            "Returning empty alliances with NO_STABLE_PARTITION status."
        )
        return [], {}, None, "NO_STABLE_PARTITION"

    power_blocks = [(sorted(group), sim.get_alliance_power(group)) for group in best]
    powers_only = [p for _, p in power_blocks]
    ratio = max(powers_only) / min(powers_only) if powers_only else 1.0
    print(
        f"[SOLVER-ECORE] Best partition={[g for g, _ in power_blocks]} "
        f"score={score:.2f} power_blocks={power_blocks} max_min_ratio={ratio:.2f}"
    )

    alliances = sorted(
        [sorted(group) for group in best if len(group) >= 2],
        key=lambda g: (-sim.get_alliance_power(g), g[0] if g else ""),
    )

    return alliances, {}, float(score), "STABLE"
