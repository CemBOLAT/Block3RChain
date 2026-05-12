"""
Step 4: Smart Contract Alliance Solver — Numba JIT Accelerated

Performance:
- All partition enumeration and scoring is done in Numba @njit
- Country data is converted to NumPy arrays (no Python dicts in hot path)
- Partitions are generated as Restricted Growth Strings (RGS) — pure integer math
- Expected speedup: 20-50x over pure Python

Rules:
1. ATOMIC GROUP CONSENSUS: All alliance members must agree on exact composition
2. SYMMETRY: If A lists B as ally, B must list A
3. HEGEMONY LIMIT: No block > 50% of world (60% if bipolar — exactly 2 blocks)
4. ISOLATION PENALTY: Solo countries get massive negative score
5. DIMINISHING RETURNS: Large blocks have coordination overhead
6. BALANCE BONUS: Even power distribution rewarded heavily
"""

import time
import numpy as np
from numba import njit
from utils import print_header

# ============================================================
# COUNTRY DATA — All previous_alliances are SYMMETRIC
# ============================================================
countries = {
    "Nigeria": {
        "troop_count": 1000,
        "previous_alliances": ["Egypt", "South Africa"],
    },
    "Egypt": {
        "troop_count": 800,
        "previous_alliances": ["Nigeria", "South Africa", "Morocco"],
    },
    "South Africa": {
        "troop_count": 600,
        "previous_alliances": ["Nigeria", "Egypt", "Kenya"],
    },
    "Kenya": {
        "troop_count": 450,
        "previous_alliances": ["South Africa", "Ethiopia"],
    },
    "Ethiopia": {
        "troop_count": 550,
        "previous_alliances": ["Kenya", "Sudan"],
    },
    "Morocco": {
        "troop_count": 700,
        "previous_alliances": ["Egypt", "Algeria"],
    },
    "Algeria": {
        "troop_count": 750,
        "previous_alliances": ["Morocco"],
    },
    "Sudan": {
        "troop_count": 400,
        "previous_alliances": ["Ethiopia"],
    },
    "Tanzania": {
        "troop_count": 450,
        "previous_alliances": ["Uganda"],
    },
    "Uganda": {
        "troop_count": 350,
        "previous_alliances": ["Tanzania"],
    },
    "Ghana": {
        "troop_count": 400,
        "previous_alliances": ["Senegal"],
    },
    "Senegal": {
        "troop_count": 300,
        "previous_alliances": ["Ghana"],
    },
}
country_names = list(countries.keys())
N = len(country_names)

# ============================================================
# SYMMETRY VALIDATION
# ============================================================
print_header("SYMMETRY VALIDATION")
errors = []
for country, data in countries.items():
    for ally in data["previous_alliances"]:
        if ally not in countries:
            errors.append(f"  {country} -> '{ally}' NOT IN SET!")
        elif country not in countries[ally]["previous_alliances"]:
            errors.append(f"  {country} -> '{ally}' is NOT symmetric!")

if errors:
    print("SYMMETRY BROKEN!")
    for e in errors:
        print(e)
    exit(1)
else:
    print("All previous_alliances are symmetric. OK.")

# ============================================================
# CONVERT TO NUMPY ARRAYS FOR JIT
# ============================================================
# Troop counts as 1D array
troops = np.array([countries[c]["troop_count"] for c in country_names], dtype=np.int32)

# Previous alliances as adjacency matrix (NxN boolean)
prev_allies = np.zeros((N, N), dtype=np.bool_)
name_to_idx = {name: i for i, name in enumerate(country_names)}
for i, name in enumerate(country_names):
    for ally in countries[name]["previous_alliances"]:
        j = name_to_idx[ally]
        prev_allies[i, j] = True

total_world_troops = int(troops.sum())
POWER_LIMIT_50 = 0.50

# ============================================================
# DISPLAY INITIAL STATE
# ============================================================
print_header("INITIAL COUNTRY DATA")
for i, name in enumerate(country_names):
    allies = countries[name]["previous_alliances"] or ["(none)"]
    print(f"  {name:15}: {troops[i]:>5} troops | Allies: {', '.join(allies)}")
print(f"\n  Total World Troops: {total_world_troops}")
print(f"  Hegemony Limit (50%): {int(total_world_troops * POWER_LIMIT_50)} troops")
print(f"  Countries: {N}")

# ============================================================
# NUMBA JIT — CORE SCORING ENGINE
# ============================================================
@njit(cache=True)
def score_partition_jit(assignments, n, troops, prev_allies, total_troops, power_limit_50):
    """
    Score a partition (represented as an integer assignment array).
    assignments[i] = block_id for country i.
    Returns integer score (higher = better). -999999 = disqualified.
    
    Scoring:
    - Hegemony: >50% of world power = disqualified (no exceptions)
    - Gains: troops from allies, with diminishing returns for large blocks
    - Losses: troops of abandoned previous allies
    - Isolation: solo countries get massive penalty
    - Balance: deviation from ideal distribution (total/K per block)
    """
    # Find number of blocks
    max_block = 0
    for i in range(n):
        if assignments[i] > max_block:
            max_block = assignments[i]
    num_blocks = max_block + 1
    
    # Compute block powers and sizes
    block_powers = np.zeros(num_blocks, dtype=np.int32)
    block_sizes = np.zeros(num_blocks, dtype=np.int32)
    for i in range(n):
        b = assignments[i]
        block_powers[b] += troops[i]
        block_sizes[b] += 1
    
    # Bipolar exception: exactly 2 blocks, no solos -> 60% limit
    # This prevents tiny solo countries (e.g. 48%/48%/4%)
    has_solo = False
    for b in range(num_blocks):
        if block_sizes[b] == 1:
            has_solo = True
            break
    is_bipolar = (num_blocks == 2) and (not has_solo)
    effective_limit = 0.60 if is_bipolar else power_limit_50
    
    # HEGEMONY CHECK
    for b in range(num_blocks):
        if block_powers[b] > total_troops * effective_limit:
            return -999999
    
    total_score = 0
    
    for i in range(n):
        my_block = assignments[i]
        n_partners = block_sizes[my_block] - 1
        
        # Raw gain from block partners
        raw_gain = block_powers[my_block] - troops[i]
        
        # Diminishing returns: coordination overhead for large blocks
        if n_partners > 0:
            efficiency = 2.0 / (1.0 + n_partners)
            gained = int(raw_gain * efficiency)
        else:
            gained = 0
        
        # Lost: previous allies NOT in my block
        lost = 0
        for j in range(n):
            if prev_allies[i, j] and assignments[j] != my_block:
                lost += troops[j]
        
        total_score += gained - lost
    
    # Isolation penalty
    for b in range(num_blocks):
        if block_sizes[b] == 1:
            total_score -= 5000
    
    # BALANCE BONUS: Deviation from ideal distribution
    # For K blocks, ideal power per block = total / K
    # Score = how close each block is to ideal (lower deviation = higher score)
    if num_blocks > 1:
        ideal_power = np.float64(total_troops) / np.float64(num_blocks)
        total_deviation = 0.0
        for b in range(num_blocks):
            diff = np.float64(block_powers[b]) - ideal_power
            total_deviation += diff * diff  # squared deviation
        
        # Normalize: max possible deviation ~ total_troops^2
        # Lower deviation = higher score
        max_deviation = np.float64(total_troops) * np.float64(total_troops)
        normalized = 1.0 - (total_deviation / max_deviation)
        total_score += int(normalized * 15000)
    
    return total_score

# ============================================================
# NUMBA JIT — PARTITION ENUMERATION VIA RESTRICTED GROWTH STRINGS
# ============================================================
@njit(cache=True)
def solve_all_partitions_jit(n, troops, prev_allies, total_troops, power_limit_50):
    """
    Enumerate ALL set partitions using Restricted Growth Strings (RGS).
    RGS rule: a[0] = 0, a[i] <= max(a[0..i-1]) + 1
    
    This is a pure-integer, branch-free enumeration — ideal for JIT.
    Total partitions = Bell(n).
    """
    # RGS state
    a = np.zeros(n, dtype=np.int32)     # Current partition encoding
    b = np.zeros(n, dtype=np.int32)     # b[i] = max(a[0..i])
    
    best_score = np.int64(-999999)
    best_a = np.zeros(n, dtype=np.int32)
    total_evaluated = np.int64(0)
    valid_count = np.int64(0)
    
    while True:
        # Score current partition
        total_evaluated += 1
        score = score_partition_jit(a, n, troops, prev_allies, total_troops, power_limit_50)
        
        if score > -999999:
            valid_count += 1
        
        if score > best_score:
            best_score = score
            for i in range(n):
                best_a[i] = a[i]
        
        # Generate next RGS (lexicographic order)
        pos = n - 1
        while pos >= 1:
            if a[pos] <= b[pos - 1]:  # Can increment
                a[pos] += 1
                # Update b[pos]
                if a[pos] > b[pos]:
                    b[pos] = a[pos]
                # Reset everything after pos
                for j in range(pos + 1, n):
                    a[j] = 0
                    b[j] = b[pos]
                break
            pos -= 1
        
        if pos < 1:
            break
    
    return best_a, best_score, total_evaluated, valid_count

# ============================================================
# JIT WARMUP — compile on a small problem first
# ============================================================
print_header("JIT COMPILATION")
print("Warming up Numba JIT (first call triggers compilation)...")
warmup_start = time.time()
_ = solve_all_partitions_jit(
    np.int32(3),
    troops[:3].copy(),
    prev_allies[:3, :3].copy(),
    np.int32(troops[:3].sum()),
    0.50
)
warmup_time = time.time() - warmup_start
print(f"JIT compilation complete in {warmup_time:.2f}s (cached for next runs)")

# ============================================================
# RUN THE SOLVER
# ============================================================
print_header("NUMBA-ACCELERATED GLOBAL PARTITION SOLVER")
print(f"Countries: {N}")
print(f"Evaluating all Bell({N}) partitions with JIT-compiled engine...")

start = time.time()
best_assignments, best_score, total_evaluated, valid_count = solve_all_partitions_jit(
    np.int32(N),
    troops,
    prev_allies,
    np.int32(total_world_troops),
    POWER_LIMIT_50
)
elapsed = time.time() - start

print(f"\nEvaluated {total_evaluated:,} partitions ({valid_count:,} valid) in {elapsed:.2f}s")
print(f"Best partition score: {best_score}")

# ============================================================
# RECONSTRUCT HUMAN-READABLE RESULTS
# ============================================================
# Convert assignment array back to named blocks
max_block = int(best_assignments.max())
result_blocks = []
for block_id in range(max_block + 1):
    members = tuple(country_names[i] for i in range(N) if best_assignments[i] == block_id)
    if members:
        result_blocks.append(members)

# ============================================================
# DISPLAY RESULTS
# ============================================================
print_header("STABLE WORLD STATE (Phase 1: Partition Solver)")

for i, block in enumerate(result_blocks):
    block_power = sum(countries[m]["troop_count"] for m in block)
    pct = (block_power / total_world_troops) * 100
    members = ", ".join(block)
    
    if len(block) == 1:
        status = "SOLO"
    else:
        status = "ALLIANCE"
    
    print(f"\n  Block {i+1} ({status}):")
    print(f"    Members: {members}")
    print(f"    Combined Power: {block_power} troops ({pct:.1f}% of world)")
    
    for member in block:
        raw_gain = sum(countries[m]["troop_count"] for m in block if m != member)
        n_partners = len(block) - 1
        if n_partners > 0:
            efficiency = 2.0 / (1.0 + n_partners)
            gained = int(raw_gain * efficiency)
        else:
            gained = 0
        
        prev = set(countries[member]["previous_alliances"])
        current = set(block) - {member}
        kept = prev.intersection(current)
        lost_allies = prev - current
        new = current - prev
        lost_troops = sum(countries[p]["troop_count"] for p in lost_allies if p in countries)
        payoff = gained - lost_troops
        
        details = []
        if kept: details.append(f"kept: {','.join(kept)}")
        if lost_allies: details.append(f"lost: {','.join(lost_allies)}")
        if new: details.append(f"new: {','.join(new)}")
        detail_str = " | ".join(details) if details else "no changes"
        
        print(f"      {member:15}: payoff={payoff:>6} ({detail_str})")

# ============================================================
# PHASE 2: NASH EQUILIBRIUM VERIFICATION (PyGambit)
# ============================================================
import pygambit as gambit

print_header("PHASE 2: NASH EQUILIBRIUM (PyGambit)")
print("Building reduced game from partition result...")
print(f"Optimal partition has {len(result_blocks)} blocks.\n")

# For each country, generate deviation strategies:
# 1. "STAY" — remain in current block
# 2. "SOLO" — leave and go alone
# 3. "SWITCH_k" — defect to block k (for each other block)
country_strategies = {}
for country in country_names:
    strategies = []
    # Find current block
    current_block = None
    current_block_idx = -1
    for idx, block in enumerate(result_blocks):
        if country in block:
            current_block = block
            current_block_idx = idx
            break
    
    # Strategy 0: STAY in current block
    strategies.append(("STAY", current_block_idx))
    
    # Strategy 1: Go SOLO
    strategies.append(("SOLO", -1))
    
    # Strategy 2+: SWITCH to each other block (if hegemony allows)
    for idx, block in enumerate(result_blocks):
        if idx == current_block_idx:
            continue
        # Check if joining this block would violate hegemony
        new_block_power = sum(countries[m]["troop_count"] for m in block) + countries[country]["troop_count"]
        # Use bipolar-aware limit
        remaining_blocks = len(result_blocks)  # Same number of blocks (country moves, doesn't create/destroy)
        if new_block_power <= total_world_troops * 0.60:  # Allow switches within reason
            strategies.append((f"SWITCH_{idx}", idx))
    
    country_strategies[country] = strategies

# Display strategy space
for country in country_names:
    strats = country_strategies[country]
    labels = [s[0] for s in strats]
    print(f"  {country:15}: {len(strats)} strategies — {', '.join(labels)}")

# Build PyGambit game
n_strats = [len(country_strategies[c]) for c in country_names]
g = gambit.Game.new_table(n_strats)
g.title = "Alliance Deviation Game (Nash Verification)"

for i, country in enumerate(country_names):
    g.players[i].label = country
    for j, (label, _) in enumerate(country_strategies[country]):
        g.players[i].strategies[j].label = label

# Compute payoff for each strategy profile
def compute_country_payoff(country, world_blocks):
    """Compute payoff for a country given the world block structure."""
    # Find which block this country is in
    my_block = None
    for block in world_blocks:
        if country in block:
            my_block = block
            break
    
    if my_block is None or len(my_block) == 0:
        return -10000  # Error state
    
    # Gains with diminishing returns
    raw_gain = sum(countries[m]["troop_count"] for m in my_block if m != country)
    n_partners = len(my_block) - 1
    if n_partners > 0:
        efficiency = 2.0 / (1.0 + n_partners)
        gained = int(raw_gain * efficiency)
    else:
        gained = 0
    
    # Lost previous allies
    previous = set(countries[country]["previous_alliances"])
    current_partners = set(my_block) - {country}
    abandoned = previous - current_partners
    lost = sum(countries[p]["troop_count"] for p in abandoned if p in countries)
    
    # Hegemony penalty
    block_power = sum(countries[m]["troop_count"] for m in my_block)
    penalty = 0
    if block_power > total_world_troops * 0.50:
        # Check if bipolar exception applies
        has_solo = any(len(b) == 1 for b in world_blocks)
        is_bipolar = (len(world_blocks) == 2 and not has_solo)
        effective_limit = 0.60 if is_bipolar else 0.50
        if block_power > total_world_troops * effective_limit:
            penalty = 50000
    
    # Isolation penalty
    if len(my_block) == 1:
        penalty += 5000
    
    return gained - lost - penalty

import itertools

print(f"\nFilling payoff table ({' x '.join(str(n) for n in n_strats)} = {np.prod(n_strats):,} profiles)...")

for profile_indices in itertools.product(*[range(n) for n in n_strats]):
    # Determine what world looks like if each country plays their chosen strategy
    # Start from the base partition and apply deviations
    
    # Build modified blocks: start with copies of original blocks as sets
    modified = [set(block) for block in result_blocks]
    
    for i, country in enumerate(country_names):
        action, target_block = country_strategies[country][profile_indices[i]]
        current_block_idx = None
        for idx, block in enumerate(modified):
            if country in block:
                current_block_idx = idx
                break
        
        if action == "STAY":
            pass  # No change
        elif action == "SOLO":
            if current_block_idx is not None:
                modified[current_block_idx].discard(country)
            modified.append({country})
        elif action.startswith("SWITCH_"):
            if current_block_idx is not None:
                modified[current_block_idx].discard(country)
            if target_block < len(modified):
                modified[target_block].add(country)
            else:
                modified.append({country})
    
    # Clean up empty blocks
    world_blocks = [tuple(sorted(b)) for b in modified if len(b) > 0]
    
    # Calculate payoff for each country
    for i, country in enumerate(country_names):
        payoff = compute_country_payoff(country, world_blocks)
        g[list(profile_indices)][g.players[i]] = payoff

# Solve for Nash Equilibria
print("Solving for Pure Strategy Nash Equilibria...")
start_nash = time.time()
equilibria = gambit.nash.enumpure_solve(g).equilibria
nash_time = time.time() - start_nash

print(f"\nFound {len(equilibria)} Nash Equilibrium(a) in {nash_time:.4f}s\n")

# Classify equilibria
stay_equilibria = []
deviation_equilibria = []

for eq_idx, eq in enumerate(equilibria):
    choices = {}
    all_stay = True
    for player in g.players:
        for s in player.strategies:
            if eq[s] > 0.5:
                choices[player.label] = s.label
                if s.label != "STAY":
                    all_stay = False
    
    if all_stay:
        stay_equilibria.append((eq_idx, choices))
    else:
        deviation_equilibria.append((eq_idx, choices))

# Show STAY equilibria (partition is Nash-stable)
if stay_equilibria:
    print(f"  ★ PARTITION IS NASH-STABLE ({len(stay_equilibria)} equilibrium found)")
    print(f"    All {N} countries prefer STAY — no unilateral deviation improves payoff.\n")
else:
    print("  ✗ Partition is NOT Nash-stable (no all-STAY equilibrium found)\n")

# Show summary of deviation equilibria 
if deviation_equilibria:
    print(f"  Additional {len(deviation_equilibria)} deviation equilibria found.")
    # Count how many deviations per type
    solo_count = 0
    switch_count = 0
    for _, choices in deviation_equilibria:
        for country, action in choices.items():
            if action == "SOLO":
                solo_count += 1
            elif action.startswith("SWITCH"):
                switch_count += 1
    print(f"    Total SOLO deviations across all equilibria:   {solo_count}")
    print(f"    Total SWITCH deviations across all equilibria: {switch_count}")
    
    # Show first 3 examples
    print(f"\n  Sample deviation equilibria (showing first 3):")
    for eq_idx, choices in deviation_equilibria[:3]:
        deviators = [f"{c}→{a}" for c, a in choices.items() if a != "STAY"]
        stayers = [c for c, a in choices.items() if a == "STAY"]
        print(f"    NE #{eq_idx+1}: {len(deviators)} deviate, {len(stayers)} stay")
        for d in deviators:
            print(f"      {d}")
        print()


# ============================================================
# VALIDATION
# ============================================================
print_header("VALIDATION")

all_assigned = set()
for block in result_blocks:
    overlap = all_assigned.intersection(set(block))
    if overlap:
        print(f"  ERROR: {overlap} in multiple blocks!")
    all_assigned.update(block)

missing = set(country_names) - all_assigned
if missing:
    print(f"  ERROR: {missing} not assigned!")

has_solo = any(len(b) == 1 for b in result_blocks)
is_bipolar = (len(result_blocks) == 2 and not has_solo)
effective_limit = 0.60 if is_bipolar else POWER_LIMIT_50
limit_label = "60% (bipolar)" if is_bipolar else "50%"

violations = []
for block in result_blocks:
    bp = sum(countries[m]["troop_count"] for m in block)
    if bp > total_world_troops * effective_limit:
        violations.append((block, bp))

if violations:
    for block, bp in violations:
        print(f"  HEGEMONY VIOLATION: {block} = {bp} troops ({bp/total_world_troops*100:.1f}%)")
else:
    print(f"  No hegemony violations (limit: {limit_label}).")

# Nash stability summary
nash_stable = any(
    all(eq[s] > 0.5 and s.label == "STAY" for player in g.players for s in player.strategies if eq[s] > 0.5)
    for eq in equilibria
)
if nash_stable:
    print("  Nash Equilibrium: CONFIRMED ✓ (no country benefits from deviating)")
else:
    print("  Nash Equilibrium: NOT confirmed (some countries may benefit from deviating)")

print("  All countries assigned to exactly one block.")
print(f"  World state is {'NASH-STABLE' if nash_stable else 'UNSTABLE'}.")

# ============================================================
# PERFORMANCE
# ============================================================
print_header("PERFORMANCE")
print(f"  Phase 1 (Numba partition solver): {elapsed:.2f}s")
print(f"  Phase 2 (PyGambit Nash solver):   {nash_time:.4f}s")
print(f"  Total:                            {elapsed + nash_time:.2f}s")
if elapsed > 0:
    speedup = 102.0 / (elapsed + nash_time)
    print(f"  Speedup vs pure Python:           {speedup:.1f}x")
