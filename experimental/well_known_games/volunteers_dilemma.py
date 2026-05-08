import time
import pygambit as gambit
import itertools

def simulate_volunteers_dilemma(N=3):
    # Create N-player game with 2 strategies each
    g = gambit.Game.new_table([2] * N)
    g.title = f"Volunteer's Dilemma (N={N})"
    
    C = 1.0 # Cost of volunteering (time, effort, risk)
    B = 5.0 # Benefit of having the issue resolved for everyone
    
    for i in range(N):
        g.players[i].label = f"Player {i+1}"
        g.players[i].strategies[0].label = "Volunteer"
        g.players[i].strategies[1].label = "Ignore"

    # Set payoffs
    for profile in itertools.product([0, 1], repeat=N):
        # Count how many volunteers (0 is Volunteer, 1 is Ignore)
        volunteers = profile.count(0)
        
        for i, choice in enumerate(profile):
            if volunteers > 0:
                if choice == 0:
                    # You volunteered. You get the benefit but pay the cost.
                    g[profile][g.players[i]] = B - C
                else:
                    # You ignored it, but someone else volunteered! Free-ride!
                    g[profile][g.players[i]] = B
            else:
                # Nobody volunteered. Everyone suffers.
                g[profile][g.players[i]] = 0.0

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
            prob_vol = float(eq[player.strategies[0]])
            prob_ign = float(eq[player.strategies[1]])
            print(f"  {player.label}: Volunteer ({prob_vol:.2f}), Ignore ({prob_ign:.2f})")

if __name__ == "__main__":
    simulate_volunteers_dilemma()
