export const RANKS = [
  { level: 1, name: 'Bronze I', minXp: 0 },
  { level: 2, name: 'Bronze II', minXp: 100 },
  { level: 3, name: 'Bronze III', minXp: 250 },
  { level: 4, name: 'Silver I', minXp: 500 },
  { level: 5, name: 'Silver II', minXp: 800 },
  { level: 6, name: 'Silver III', minXp: 1200 },
  { level: 7, name: 'Gold', minXp: 1800 },
  { level: 8, name: 'Platinum', minXp: 2600 },
  { level: 9, name: 'Diamond', minXp: 3600 },
  { level: 10, name: 'Emerald', minXp: 5000 },
  { level: 11, name: 'Ultra Disciplined', minXp: 7000 },
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
    switch(priority) {
        case 'High': return 20;
        case 'Medium': return 10;
        case 'Low': default: return 5;
    }
};

export const FOCUS_XP_PER_HOUR = 15;
export const MISSED_TASK_PENALTY = -5;
export const TIMETABLE_SLOT_XP = 2;
