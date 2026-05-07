import { Zap, Sword, Coins, Users } from "lucide-react";

export const ACTION_GROUPS = [
  {
    id: "troops",
    actions: [
      {
        type: "troop_add" as const,
        label: "Bless Nation",
        secondary: "+5K Troops",
        icon: Zap,
        iconColor: "#facc15",
        secondaryColor: "success.main",
      },
      {
        type: "troop_remove" as const,
        label: "Smite Nation",
        secondary: "-5K Troops",
        icon: Sword,
        iconColor: "#f87171",
        secondaryColor: "error.main",
      },
    ],
  },
  {
    id: "gold",
    actions: [
      {
        type: "gold_add" as const,
        label: "Donate Gold",
        secondary: "+10K Gold",
        icon: Coins,
        iconColor: "#facc15",
        secondaryColor: "warning.main",
      },
      {
        type: "gold_remove" as const,
        label: "Tax Nation",
        secondary: "-10K Gold",
        icon: Coins,
        iconColor: "#f87171",
        secondaryColor: "error.light",
      },
    ],
  },
  {
    id: "population",
    actions: [
      {
        type: "pop_add" as const,
        label: "Invite Migrants",
        secondary: "+5M Population",
        icon: Users,
        iconColor: "#60a5fa",
        secondaryColor: "info.main",
      },
      {
        type: "pop_remove" as const,
        label: "Deportation",
        secondary: "-5M Population",
        icon: Users,
        iconColor: "#94a3b8",
        secondaryColor: "text.secondary",
      },
    ],
  },
];
