export const RANKS = [
  { level: 1, name: 'Bronze I', minXp: 0 },
  { level: 2, name: 'Bronze II', minXp: 10 },
  { level: 3, name: 'Bronze III', minXp: 25 },
  { level: 4, name: 'Silver I', minXp: 50 },
  { level: 5, name: 'Silver II', minXp: 80 },
  { level: 6, name: 'Silver III', minXp: 120 },
  { level: 7, name: 'Gold', minXp: 180 },
  { level: 8, name: 'Platinum', minXp: 260 },
  { level: 9, name: 'Diamond', minXp: 360 },
  { level: 10, name: 'Emerald', minXp: 500 },
  { level: 11, name: 'Ultra Disciplined', minXp: 750 },
];

export const getRankInfo = (xp) => {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1];

  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] || null;
    } else {
      break;
    }
  }

  const progress = nextRank 
    ? ((xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100 
    : 100;

  return { currentRank, nextRank, progress };
};

// pointsEngine.js logic combined
export const getTaskXP = (priority) => {
    return 1; // Always 1 point as requested
};

export const FOCUS_XP_PER_HOUR = 2;
export const MISSED_TASK_PENALTY = -1;
export const TIMETABLE_SLOT_XP = 1;
