import time
import pygambit as gambit
import itertools

def simulate_diners_dilemma(N=3):
    # Create N-player game with 2 strategies each
    g = gambit.Game.new_table([2] * N)
    g.title = f"Unscrupulous Diner's Dilemma (N={N})"
    
    # Define our economic values
    V_cheap = 2.0
    C_cheap = 2.0
    V_exp = 4.0
    C_exp = 6.0
    
    for i in range(N):
        g.players[i].label = f"Diner {i+1}"
        g.players[i].strategies[0].label = "Cheap"
        g.players[i].strategies[1].label = "Expensive"

    # Set payoffs
    for profile in itertools.product([0, 1], repeat=N):
        total_cost = 0
        for choice in profile:
            # 0 is Cheap, 1 is Expensive
            total_cost += C_exp if choice == 1 else C_cheap
        
        individual_cost = total_cost / N
        
        for i, choice in enumerate(profile):
            val = V_exp if choice == 1 else V_cheap
            # Payoff = Value of your meal - Your share of the total bill
            g[profile][g.players[i]] = val - individual_cost

    from game_utils import print_game_table
    print_game_table(g)
    
    print("Computing Nash Equilibria...")
    start_time = time.time()
    equilibria = gambit.nash.enumpoly_solve(g).equilibria
    end_time = time.time()
    
    print(f"Computation took: {end_time - start_time:.6f} seconds")
    print(f"Found {len(equilibria)} Nash equilibrium(s):")
    
    for i, eq in enumerate(equilibria):
        print(f"\nEquilibrium {i + 1}:")
        for p_idx in range(N):
            player = g.players[p_idx]
            prob_cheap = float(eq[player.strategies[0]])
            prob_exp = float(eq[player.strategies[1]])
            print(f"  {player.label}: Cheap ({prob_cheap:.2f}), Expensive ({prob_exp:.2f})")

if __name__ == "__main__":
    simulate_diners_dilemma()
