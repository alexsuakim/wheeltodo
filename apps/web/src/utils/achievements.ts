export type AchievementKey = "streak" | "tasks" | "focus" | "speed" | "rest" | "spin";

export interface AchievementTier {
  id: string;
  target: number;
  badge: string;
}

export interface AchievementDef {
  key: AchievementKey;
  label: string;
  description: (target: number) => string;
  iconName: string;
  color: string;
  tiers: AchievementTier[];
}

export type AchievementValues = Record<AchievementKey, number>;

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    key: "streak",
    label: "On Fire",
    description: (t) => `${t}-day streak`,
    iconName: "Flame",
    color: "#FF5C4D",
    tiers: [
      { id: "streak_3",   target: 3,   badge: "Spark"    },
      { id: "streak_7",   target: 7,   badge: "Blazing"  },
      { id: "streak_30",  target: 30,  badge: "Inferno"  },
      { id: "streak_100", target: 100, badge: "Eternal"  },
    ],
  },
  {
    key: "tasks",
    label: "Achiever",
    description: (t) => `${t} task${t !== 1 ? "s" : ""} done`,
    iconName: "Trophy",
    color: "#A78BFA",
    tiers: [
      { id: "tasks_1",   target: 1,   badge: "First Step" },
      { id: "tasks_10",  target: 10,  badge: "Momentum"   },
      { id: "tasks_50",  target: 50,  badge: "Achiever"   },
      { id: "tasks_100", target: 100, badge: "Century"    },
    ],
  },
  {
    key: "focus",
    label: "Deep Work",
    description: (t) => t >= 60 ? `${t / 60}h focused` : `${t}m focused`,
    iconName: "Clock",
    color: "#4ECDC4",
    tiers: [
      { id: "focus_60",   target: 60,   badge: "Focused"     },
      { id: "focus_300",  target: 300,  badge: "In The Zone" },
      { id: "focus_600",  target: 600,  badge: "Deep Work"   },
      { id: "focus_3000", target: 3000, badge: "Flow State"  },
    ],
  },
  {
    key: "speed",
    label: "Speed Run",
    description: (t) => `${t} task${t !== 1 ? "s" : ""} under time`,
    iconName: "Zap",
    color: "#FFE66D",
    tiers: [
      { id: "speed_1",  target: 1,  badge: "Quick Fix"   },
      { id: "speed_5",  target: 5,  badge: "Sprinter"    },
      { id: "speed_20", target: 20, badge: "Road Runner" },
    ],
  },
  {
    key: "rest",
    label: "Rest Champion",
    description: (t) => `${t} rest day${t !== 1 ? "s" : ""}`,
    iconName: "Moon",
    color: "#93C5FD",
    tiers: [
      { id: "rest_1",  target: 1,  badge: "Day Off"    },
      { id: "rest_7",  target: 7,  badge: "Balanced"   },
      { id: "rest_30", target: 30, badge: "Zen Master" },
    ],
  },
  {
    key: "spin",
    label: "Spin Doctor",
    description: (t) => `Spin the wheel ${t} time${t !== 1 ? "s" : ""}`,
    iconName: "RotateCcw",
    color: "#F9A8D4",
    tiers: [
      { id: "spin_1",  target: 1,  badge: "First Spin"      },
      { id: "spin_10", target: 10, badge: "Spin Doctor"      },
      { id: "spin_50", target: 50, badge: "Wheel of Fortune" },
    ],
  },
];

export function getNextAchievement(values: AchievementValues) {
  let best: {
    def: AchievementDef;
    tier: AchievementTier;
    current: number;
    pct: number;
  } | null = null;

  for (const def of ACHIEVEMENT_DEFS) {
    const val = values[def.key];
    for (const tier of def.tiers) {
      if (val >= tier.target) continue;
      const pct = val / tier.target;
      if (!best || pct > best.pct) {
        best = { def, tier, current: val, pct };
      }
    }
  }
  return best;
}

export function getUnlockedTierIds(values: AchievementValues): string[] {
  const unlocked: string[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    for (const tier of def.tiers) {
      if (values[def.key] >= tier.target) unlocked.push(tier.id);
    }
  }
  return unlocked;
}
