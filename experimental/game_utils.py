import pygambit as gambit
import itertools

def print_game_table(g: gambit.Game):
    print(f"Game Created: {g.title}")
    
    N = len(g.players)
    if N < 2:
        print("Payoff Table:")
        return
        
    p1 = g.players[0]
    p2 = g.players[1]
    
    # Other players
    other_players = list(g.players)[2:]
    other_strategy_counts = [len(p.strategies) for p in other_players]
    other_ranges = [range(c) for c in other_strategy_counts]
    
    # Iterate over all combinations of other players' strategies
    # For 2-player games, this loops exactly once with an empty tuple ()
    for other_profile in itertools.product(*other_ranges):
        # Print the context if there are more than 2 players
        if other_players:
            context_labels = [f"{other_players[i].label}: {other_players[i].strategies[c].label}" for i, c in enumerate(other_profile)]
            print("\n" + "=" * 60)
            print(" | ".join(context_labels).center(60))
            print("=" * 60)
            
        print("\nPayoff Matrix:")
        
        # Calculate dynamic widths
        # Make the columns wider if there are more players to fit the payoffs
        col_w = max(16, N * 6)
        s1_labels = [s.label for s in p1.strategies]
        s2_labels = [s.label for s in p2.strategies]
        
        max_strat_len = max(len(s) for s in s1_labels)
        left_w = max(15, max_strat_len + 3)
        
        # Header for Player 2
        print(f"{'':<{left_w}} {p2.label:^{col_w * len(s2_labels) + len(s2_labels) * 3}}")
        header_row = f"{'':<{left_w}}"
        for s2 in s2_labels:
            header_row += f"  {s2:^{col_w}} "
        print(header_row)
        
        sep_line = " " * left_w + "+" + ("-" * (col_w + 2) + "+") * len(s2_labels)
        print(sep_line)
        
        # Rows for Player 1
        for i, s1 in enumerate(s1_labels):
            empty_row = f"{'':<{left_w}}|" + (" " * (col_w + 2) + "|") * len(s2_labels)
            print(empty_row)
            
            data_row = f"{s1:>{left_w-2}}  |"
            for j, s2 in enumerate(s2_labels):
                # Construct the full profile index
                full_profile = [i, j] + list(other_profile)
                payoffs = [float(g[full_profile][p]) for p in g.players]
                
                # Format payoffs, e.g. (1, 2, 3)
                # Keep 1 decimal place if it's not a whole number to fit nicer, but 0 decimal if it is
                formatted_payoffs = [f"{p:.1f}" if not p.is_integer() else f"{p:.0f}" for p in payoffs]
                payoffs_str = "(" + ", ".join(formatted_payoffs) + ")"
                
                data_row += f" {payoffs_str:^{col_w}} |"
            
            print(data_row)
            # Print the player 1 label vertically aligned in the middle
            if i == len(s1_labels) // 2 - (1 if len(s1_labels) % 2 == 0 else 0):
                print(f"{p1.label:>{left_w-2}}  |" + (" " * (col_w + 2) + "|") * len(s2_labels))
            else:
                print(empty_row)
            print(sep_line)
    print("\n")
