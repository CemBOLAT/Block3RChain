# Default alliance solver parameters (shared with API / orchestrator).
DEFAULT_RATIO_LIMIT = 1.5
DEFAULT_ALPHA = 0.10
DEFAULT_BETA = 1.5
DEFAULT_EPSILON_FRACTION = 0.05

DEFAULT_ALLIANCE_PARAMETERS = {
    "ratio_limit": DEFAULT_RATIO_LIMIT,
    "alpha": DEFAULT_ALPHA,
    "beta": DEFAULT_BETA,
    "epsilon_fraction": DEFAULT_EPSILON_FRACTION,
}

# Bell numbers B(n) for n = 0..15.
# B(n) is the number of set partitions of an n-element set.
BELL_NUMBERS = [
    1, 1, 2, 5, 15, 52, 203, 877, 4140, 21147, 115975, 678570, 4213597,
    27644437, 190899322, 1382958545,
]
