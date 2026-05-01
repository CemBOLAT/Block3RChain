import time
import pygambit as gambit

def simulate_prisoners_dilemma():
    g = gambit.Game.new_table([2, 2])
    g.title = "Prisoner's Dilemma"
    
    p1 = g.players[0]
    p2 = g.players[1]
    p1.label = "Player 1"
    p2.label = "Player 2"
    
    p1.strategies[0].label = "confess"
    p1.strategies[1].label = "don't confess"
    p2.strategies[0].label = "confess"
    p2.strategies[1].label = "don't confess"

    # Set payoffs from the classic image
    g[0, 0][p1] = -6
    g[0, 0][p2] = -6

    g[0, 1][p1] = 0
    g[0, 1][p2] = -10

    g[1, 0][p1] = -10
    g[1, 0][p2] = 0

    g[1, 1][p1] = -1
    g[1, 1][p2] = -1

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
        print(f"  {p1.label}:")
        print(f"    {p1.strategies[0].label}: {float(eq[p1.strategies[0]]):.2f}")
        print(f"    {p1.strategies[1].label}: {float(eq[p1.strategies[1]]):.2f}")
        
        print(f"  {p2.label}:")
        print(f"    {p2.strategies[0].label}: {float(eq[p2.strategies[0]]):.2f}")
        print(f"    {p2.strategies[1].label}: {float(eq[p2.strategies[1]]):.2f}")

if __name__ == "__main__":
    simulate_prisoners_dilemma()
