export type Medal = "bronze" | "silver" | "gold" | "platinum";

type MedalDef = { label: string; color: string; emoji: string };

const THRESHOLDS: [Medal, number][] = [
  ["platinum", 50],
  ["gold", 30],
  ["silver", 15],
  ["bronze", 5],
];

export const MEDAL_DEFS: Record<Medal, MedalDef> = {
  bronze: { label: "Bronze", color: "#cd7f32", emoji: "🥉" },
  silver: { label: "Silver", color: "#c0c0c0", emoji: "🥈" },
  gold: { label: "Gold", color: "#fbbf24", emoji: "🥇" },
  platinum: { label: "Platinum", color: "#e0f2fe", emoji: "💎" },
};

export const getMedal = (score: number): Medal | null => {
  for (const [medal, threshold] of THRESHOLDS) {
    if (score >= threshold) return medal;
  }
  return null;
};
