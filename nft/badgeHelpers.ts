import { BADGE_CONFIG, BADGE_LEVELS } from "./badgeConfig";

export function getClaimableBadges(aiWinCount: number, claimedBadgeKeys: string[]) {
  return BADGE_LEVELS
    .map((wins) => BADGE_CONFIG[wins])
    .filter((badge) => aiWinCount >= badge.wins && !claimedBadgeKeys.includes(badge.key));
}

export function getNextBadge(aiWinCount: number) {
  for (const wins of BADGE_LEVELS) {
    const badge = BADGE_CONFIG[wins];
    if (aiWinCount < badge.wins) {
      return {
        ...badge,
        remaining: badge.wins - aiWinCount,
      };
    }
  }

  const top = BADGE_CONFIG[1000];
  return {
    ...top,
    remaining: 0,
  };
}