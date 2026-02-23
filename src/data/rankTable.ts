import type { RankDef } from '../types/rank.types';

export const RANK_TABLE: RankDef[] = [
  { id: 'sinip',        name: '신입',       world: 'company',  cumulativeDays: 0,  item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.0  },
  { id: 'daeri',        name: '대리',       world: 'company',  cumulativeDays: 2,  item: 'coffee', unlocksEvent: 'bump',    speedMultiplier: 1.05 },
  { id: 'gwajang',      name: '과장',       world: 'company',  cumulativeDays: 4,  item: 'coffee', unlocksEvent: 'wind',    speedMultiplier: 1.1  },
  { id: 'timjang',      name: '팀장',       world: 'company',  cumulativeDays: 7,  item: 'coffee', unlocksEvent: 'slope',   speedMultiplier: 1.15 },
  { id: 'bujang',       name: '부장',       world: 'company',  cumulativeDays: 10, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.2  },
  { id: 'sangmu',       name: '상무',       world: 'company',  cumulativeDays: 13, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.25 },
  { id: 'sajang',       name: '사장',       world: 'company',  cumulativeDays: 16, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.3  },
  { id: 'hoejang',      name: '회장',       world: 'politics', cumulativeDays: 21, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.35 },
  { id: 'chongsu',      name: '총수',       world: 'politics', cumulativeDays: 26, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.4  },
  { id: 'gukhoe',       name: '국회의원',   world: 'politics', cumulativeDays: 31, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.45 },
  { id: 'daetongryeong',name: '대통령',     world: 'politics', cumulativeDays: 36, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.5  },
  { id: 'yongsa',       name: '신입용사',   world: 'isekai',   cumulativeDays: 38, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.55 },
  { id: 'gisa',         name: '기사',       world: 'isekai',   cumulativeDays: 41, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.6  },
  { id: 'mabeopsa',     name: '마법사',     world: 'isekai',   cumulativeDays: 44, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.65 },
  { id: 'yeongung',     name: '영웅',       world: 'isekai',   cumulativeDays: 49, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.7  },
  { id: 'mawang',       name: '마왕',       world: 'isekai',   cumulativeDays: 54, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.75 },
  { id: 'sin',          name: '신',         world: 'isekai',   cumulativeDays: 59, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.8  },
  { id: 'ujuin',        name: '신입우주인', world: 'space',    cumulativeDays: 64, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 1.85 },
  { id: 'dal',          name: '달탐험가',   world: 'space',    cumulativeDays: 69, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 1.9  },
  { id: 'hwaseong',     name: '화성탐험가', world: 'space',    cumulativeDays: 74, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 1.95 },
  { id: 'geumseong',    name: '금성탐험가', world: 'space',    cumulativeDays: 79, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 2.0  },
  { id: 'mokseong',     name: '목성탐험가', world: 'space',    cumulativeDays: 84, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 2.05 },
  { id: 'cheonwang',    name: '천왕성탐험가',world: 'space',   cumulativeDays: 89, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 2.1  },
];

export const LOOP_CYCLE_DAYS = 90;

export function getRankForDays(totalCompletedDays: number): RankDef {
  const effectiveDays = totalCompletedDays % LOOP_CYCLE_DAYS;
  let result = RANK_TABLE[0];
  for (const rank of RANK_TABLE) {
    if (rank.cumulativeDays <= effectiveDays) {
      result = rank;
    }
  }
  return result;
}

export function getNextRank(currentRank: RankDef): RankDef | null {
  const idx = RANK_TABLE.findIndex((r) => r.id === currentRank.id);
  if (idx === -1 || idx === RANK_TABLE.length - 1) return null;
  return RANK_TABLE[idx + 1];
}

export function getDaysUntilPromotion(totalCompletedDays: number): number | null {
  const current = getRankForDays(totalCompletedDays);
  const next = getNextRank(current);
  if (next === null) return null;
  const effectiveDays = totalCompletedDays % LOOP_CYCLE_DAYS;
  return next.cumulativeDays - effectiveDays;
}
