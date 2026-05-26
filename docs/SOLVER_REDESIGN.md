# Solver Redesign Notes — Cooperative Game Theory for Block3RChain

**Status:** Implemented (2026-05-20). Extended 2026-05-26 with castles (attack vs defense), `AllianceParameters` / `GameParameters`, and gateway-driven tuning. Regression tests in `backend/engine/tests/test_solver.py`.

**Status types:** Public outcomes use `AllianceOutcome` (`ledger_types.py`): `STABLE`, `NO_STABLE_PARTITION`. Internal partition rejects use `PartitionRejectReason` + `PartitionEvaluation` (`partition_types.py`). `calculate_alliances()` raises `ValueError` on an empty ledger — callers must guard first.

**HAPPY_WORLD (deferred):** Grand-coalition “Happy world!” terminal is designed but **disabled** in `solver.py` (commented out). Scenarios that would have been `HAPPY_WORLD` now return `NO_STABLE_PARTITION` (WW3). Re-enable by uncommenting `grand_coalition_is_individually_rational` and the block in `calculate_alliances`, then restore `HAPPY_WORLD` on `AllianceOutcome` and the frontend.

**Scope:** `backend/engine/solver.py` (`StrategicMilitarySim`, `evaluate_stability`, `calculate_alliances`).

**Last updated:** 2026-05-26.

**Future work:** [FUTURE_WORK.md](./FUTURE_WORK.md) (deeper economy-in-solver, API cleanup, deferred HAPPY_WORLD).

This document captures the design conversation about why the current alliance
solver always ends the game on the first intervention, what cooperative game
theory says about it, and how we plan to fix it. It is meant as a living spec
for the redesign — keep it updated as decisions are made or revisited.

---

## 1. Project intent (what the solver is modelling)

- **Players:** Each country is a rational agent. Its only goal is **survival**.
- **God / user role:** The user plays a "god" via interventions
  (add/remove country, adjust troops/gold/population). After each batch of
  interventions, the solver recomputes the world's coalition structure.
- **Peace condition:** Solver finds a coalition structure that satisfies the
  survival constraints for every country.
- **Lose condition (WW3):** Solver cannot find any coalition structure that
  satisfies the constraints. The game ends.
- **Threat model:** The primary military threat is the **power-ratio rule**
  (default `ratio_limit = 1.5×`): `max(alliance attack) / min(alliance defense)`.
  **Attack** = sum of member troops. **Defense** = sum of member troops plus
  each member's castle defense bonuses (`game_parameters.castles[level].defense`).
  If the strongest attacker can overwhelm the weakest defender, the partition
  is imbalanced → WW3 when no valid partition exists.
- **Why countries cooperate:** To pool troops and stay within survivable power
  ratios of every potential rival.
- **Why countries don't all merge into one big alliance:** Big alliances
  should be more expensive to coordinate than small ones, so there is a
  natural optimal alliance size.

---

## 2. Diagnosis of the current bug

Reproduction from the user's log (USA + Canada + Mexico, default settings):

| # | Partition | Ratio (≤ 1.5?) | Per-alliance share vs solo | Verdict |
|---|---|---|---|---|
| 1 | `[USA, Canada, Mexico]` | n/a | n/a | `single_pole` |
| 2 | `[USA] / [Canada, Mexico]` | 51k vs 55k = 0.93 ✓ | Canada share = 27,500 < solo 30,000 | `exploited` |
| 3 | `[USA, Canada] / [Mexico]` | 81k / 25k = **3.24** ✗ | — | `imbalance` |
| 4 | `[USA, Mexico] / [Canada]` | 76k / 30k = **2.53** ✗ | — | `imbalance` |
| 5 | `[USA] / [Canada] / [Mexico]` | 51k / 25k = **2.04** ✗ | — | `imbalance` |

Result: 0 / 5 partitions valid → `NO_STABLE_PARTITION` → WW3 on the first
intervention, every time.

### Two compounding root causes

1. **`get_v(S)` is additive, not super-additive.** The current code returns
   `Σ powers` for any non-hegemony coalition. There is zero synergy from
   cooperating, so coalitions never produce more than their parts.

2. **Equal-split exploitation rule is brutal.** `payout_per_country = total_v / |S|`
   means every member above the alliance's mean power is automatically
   flagged "exploited". In any 2-country alliance with unequal members, the
   stronger member is *always* worse off than going solo. The `epsilon = 60`
   loyalty cushion is negligible against troop counts in the tens of
   thousands.

Combine these with the tight `ratio_limit = 1.5×` and the admissible-partition
set is empty for almost any non-trivial scenario.

---

## 3. Brief refresher on the game-theory concepts in play

- **Characteristic function `v(S)`** — the worth a coalition `S` can guarantee
  for itself. For coalitions to form, `v` should be **super-additive**:
  `v(S ∪ T) ≥ v(S) + v(T)`. Without that, no rational country joins
  anything.
- **Core** — payouts where no sub-coalition can do better by breaking off.
  Requires individual rationality + coalitional rationality. The core is
  often empty.
- **ε-core / least core** — relax every coalition constraint by ε (or the
  smallest ε that makes the relaxed set non-empty).
- **Shapley value** (not implemented) — each player's average marginal
  contribution; a natural alternative if alliance worth were *split*
  instead of shared as a club good. The current solver does not use Shapley
  payouts; an old unused helper was removed from `solver.py`.
- **Hedonic coalition formation game** — payoff depends only on the
  composition of the coalition you belong to, not on a global allocation.
  Fits this project well: every member of an alliance enjoys a club good
  ("being in this alliance") together.

The redesign below leans on the **hedonic-game framing**, because the
project's payoff model is "every member of the alliance enjoys its strength
together" rather than "the alliance has a pot of utility to divide".

---

## 4. Q&A captured during design

### Q1 — What does "WW3" mean?
> A rare extreme outcome, or a real possible outcome the player must avoid?

**A:** A real outcome. WW3 fires when constraints cannot be jointly
satisfied. The user's job is to make interventions that keep the world
stable. WW3 ends the game.

### Q2 — Why do countries want to join alliances?
> Because alliances are stronger than the sum of their parts? Because of
> shared spoils? Something else?

**A:** Pure survival. The 1.5× ratio rule is the only existing threat.
Countries pool troops to keep no rival alliance overpowering. Equal-split is
wrong; pure super-additive with no fee leads to grand coalition (also
wrong). The intended fix is an **alliance fee** that grows with alliance
size — bigger alliances cost more per member, so there is a sweet spot.

### Q3 (follow-up) — What shape should `fee(k)` have?
> Linear, quadratic, step? Absolute troop count, or relative to alliance
> power?

**A:** Fee should be **relative to the alliance's total power** ("the bigger
the countries get the harder cooperation gets"). Exact curve to be tuned by
experimentation; what matters is that fee scales with alliance size *and*
with alliance power, so the same model works for small and large worlds.

### Q4 (follow-up) — What is the ratio rule actually comparing?

**Original design:** `max(alliance troops) / min(alliance troops)`.

**As implemented (2026-05-26):** `max(alliance attack troops) / min(alliance defense troops + castles)`.
Castles fortify defenders but do not add to attack totals. Rationale unchanged: if the
strongest attacker can beat the weakest defender, the world is militarily unstable.
Alternative `max / sum(others)` remains on the shelf.

### Q5 (raised by user) — What if the only stable partition is the grand coalition?
**A:** Add an **optional** end-state called **"The world is in peace. Happy
world!"** (`HAPPY_WORLD`) when the grand coalition is individually rational
but no multipolar partition exists. **Currently disabled** in `solver.py`;
those worlds get `NO_STABLE_PARTITION` (WW3) until the feature is re-enabled.

---

## 5. Proposed model

A **hedonic coalition formation game** with a club-good payoff structure
plus a size-dependent coordination fee:

- **Power of an alliance:** `power(S) = Σ troops of members in S`.
- **Coordination fee:** `fee(S)` is a function of both `|S|` and `power(S)`.
  Concrete starting point (subject to tuning):

      fee(S) = α · power(S) · (|S| - 1)^β

  - `α` controls fee magnitude (e.g., 0.05 → 5% of pooled power per extra
    member at β=1).
  - `β` controls how fast fee grows with alliance size (β=1 linear,
    β=2 quadratic).
  - `fee({i}) = 0` (no overhead when alone).

- **Per-member payoff (club good):**

      payoff(i, S) = power(S) - fee(S)

  Every member of the alliance receives the same payoff. (Not a split — the
  alliance's effective strength is shared, not divided.)

- **Stability of a partition `P`:**

  1. **No internal exploitation.** For every country `i` in alliance
     `S ∈ P`: `payoff(i, S) ≥ payoff(i, {i})` (i.e., better than going
     solo). Optionally extend to: better than joining any other alliance
     `T ∈ P` that would accept `i` (Nash stability).
  2. **External threat constraint.** `max_attack / min_defense ≤ ratio_limit`
     (attack = troops; defense = troops + castle bonuses per member).

- **Terminal states (active):**
  - **WW3 (`NO_STABLE_PARTITION`):** No partition satisfies both (1) and (2).
  - **Peace (`STABLE`):** A valid multipolar partition was found.
- **Deferred — "Happy world!" (`HAPPY_WORLD`):** When search finds no valid
  partition but every country prefers the grand coalition over going solo.
  Implementation exists in comments in `solver.py`; not wired to API/UI yet.

### Worked example

USA = 51k, Canada = 30k, Mexico = 25k. Fee schedule (illustrative):
`fee(1) = 0`, `fee(2) = 20k`, `fee(3) = 60k`.

| Partition | Per-member payoff | Solo defection? | Ratio | Stable? |
|---|---|---|---|---|
| `[USA] / [Can, Mex]` | USA=51k, Can=Mex=35k | none | 1.08 ✓ | **YES** |
| `[USA, Can] / [Mex]` | USA=Can=61k, Mex=25k | none | 3.24 ✗ | no |
| `[USA, Mex] / [Can]` | USA=Mex=56k, Can=30k | none | 2.53 ✗ | no |
| `[USA] / [Can] / [Mex]` | all solo | n/a | 2.04 ✗ | no |
| `[USA, Can, Mex]` | 46k each | USA (51 > 46) | n/a | no |

Unique stable partition: `[USA] / [Canada, Mexico]`. This matches the
intuitive answer.

---

## 6. Fix options (priority order)

Each item below is a separable change. The minimum viable change is items
**1–4**; items 5–7 are quality-of-life and rigor improvements.

1. **Replace `get_v(S) = Σ powers` with `get_v(S) = Σ powers - fee(S)`** where
   `fee(S) = α · power(S) · (|S| - 1)^β`. (Item 1 + 2 from the user's notes
   collapsed into one structural change.)
2. **Change payoff per member from `total_v / |S|` (equal split) to
   `total_v`** (club good). Every member of an alliance gets the full,
   fee-adjusted value.
3. **Change the exploitation check from "share ≥ solo" to "payoff in this
   alliance ≥ payoff if I leave"**. Start with the solo-defection version;
   later optionally extend to "join another alliance" (Nash stability) or
   "form a new sub-coalition" (core stability).
4. **Make `epsilon` meaningful** — replace the flat 60 with a relative
   cushion (e.g., `epsilon = 0.05 · solo_power`) so the loyalty bonus has
   real weight.
5. **"Happy world!" terminal state** — coded but **disabled** (see header note).
6. **Soft-fail across rules.** Sum up per-rule violation magnitudes into a
   total penalty; pick the least-broken partition. Reserve WW3 for the case
   where every option has a *catastrophic* total. Keeps WW3 meaningful but
   avoids cliff-edge behavior near the threshold.
7. **(Stretch)** Replace solo-defection check with full **core-stability**:
   no subset of countries can break off and strictly improve every
   member's payoff simultaneously. More expensive (`2^n` checks) but
   matches the textbook definition.

### Decisions locked in by user
- Fee is **relative to alliance power**, not absolute.
- Ratio rule stays **strict `max / min ≤ 1.5`** for now.
- **"Happy world!"** end-state was approved but is **deferred** until re-enabled in code.

### Decisions still open
- Exact fee curve parameters (`α`, `β`). Pick by experiment after the
  redesign is in place.
- Whether to add Nash-stability deviations (move to another alliance) or
  stop at solo-defection.
- Re-enable **HAPPY_WORLD** when product wants a non-WW3 outcome for
  grand-coalition-only worlds.
- The alternative `max / sum(others)` ratio rule remains on the shelf as
  a backup if the strict rule turns out to be too restrictive in
  multi-country worlds.

---

## 7. Implementation status

**Shipped:**

- Hedonic fee + club-good payoffs in `backend/engine/solver.py`.
- `AllianceParameters` (`ratio_limit`, `α`, `β`, `epsilon_fraction`, `strategy`) — God-tunable via config API + dashboard.
- Castle defense in imbalance and solo-worth checks; attack power remains troop-only.
- `calculate_alliances(troop, castle, current_alliances, parameters, game_parameters)`.

**Deferred:**

- `HAPPY_WORLD` branch in `calculate_alliances` (commented out).
- Nash / core stability (FW-5 in FUTURE_WORK.md).
- Direct gold/pop influence on alliance choice (FW-1 in FUTURE_WORK.md).

Default parameters (in `engine/constants.py` / `AllianceParameters`):
- `ratio_limit = 1.5`
- `α = 0.10`, `β = 1.5` for `fee(S) = α · power(S) · (|S| - 1)^β`
- `epsilon_fraction = 0.05` (5% of solo defense power)

---

## 8. Open follow-ups / notes for next session

- Decide whether stability uses solo-defection only, Nash, or full core.
- Re-enable HAPPY_WORLD when ready (solver comments + frontend + tests).
- Pick concrete `α`, `β` after running the new solver on a handful of
  hand-built scenarios (2 countries, 3 countries equal, 3 countries
  unequal, 4-country world with one super-power, etc.).
- Capture a few **regression scenarios** as fixtures so future tweaks to
  the fee curve don't silently break the USA/Canada/Mexico baseline.
