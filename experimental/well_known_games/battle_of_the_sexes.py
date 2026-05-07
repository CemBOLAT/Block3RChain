import time
import pygambit as gambit

def simulate_battle_of_the_sexes():
    g = gambit.Game.new_table([2, 2])
    g.title = "Battle of the Sexes"
    
    p1 = g.players[0]
    p2 = g.players[1]
    p1.label = "Alice"
    p2.label = "Bob"
    
    p1.strategies[0].label = "Opera"
    p1.strategies[1].label = "Football"
    p2.strategies[0].label = "Opera"
    p2.strategies[1].label = "Football"

    # Alice prefers Opera (3), Bob also enjoys it but prefers Football (2)
    g[0, 0][p1] = 3
    g[0, 0][p2] = 2

    # If they go to different places, they miss each other and get 0
    g[0, 1][p1] = 0
    g[0, 1][p2] = 0

    g[1, 0][p1] = 0
    g[1, 0][p2] = 0

    # Bob prefers Football (3), Alice also enjoys it but prefers Opera (2)
    g[1, 1][p1] = 2
    g[1, 1][p2] = 3

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
    simulate_battle_of_the_sexes()
