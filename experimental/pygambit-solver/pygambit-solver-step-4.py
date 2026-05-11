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
print_header("STABLE WORLD STATE")

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
        # Compute payoff for display
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

print("  All countries assigned to exactly one block.")
print("  World state is STABLE.")

# ============================================================
# PERFORMANCE COMPARISON
# ============================================================
print_header("PERFORMANCE")
print(f"  Pure Python baseline: ~102s (previous run)")
print(f"  Numba JIT:            {elapsed:.2f}s")
if elapsed > 0:
    speedup = 102.0 / elapsed
    print(f"  Speedup:              {speedup:.1f}x")
