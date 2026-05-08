import itertools

def calculate_all_possible_alliances(countries_list):
    alliances = []
    for r in range(1, len(countries_list) + 1):
        for combo in itertools.combinations(countries_list, r):
            alliances.append(list(combo))
    return alliances

def print_header(title, width=40):
    print("\n" + "=" * width)
    print(title.center(width))
    print("=" * width)
