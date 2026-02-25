import type { RankDef } from '../types/rank.types';

export const RANK_TABLE: RankDef[] = [
  // ── 직장 (company) ──────────────────────────────────────────────────────────
  { id: 'sinip',         name: '신입',        world: 'company',  cumulativeDays: 0,  item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.0  },
  { id: 'daeri',         name: '대리',        world: 'company',  cumulativeDays: 2,  item: 'coffee', unlocksEvent: 'bump',    speedMultiplier: 1.05 },
  { id: 'gwajang',       name: '과장',        world: 'company',  cumulativeDays: 4,  item: 'coffee', unlocksEvent: 'wind',    speedMultiplier: 1.1  },
  { id: 'timjang',       name: '팀장',        world: 'company',  cumulativeDays: 7,  item: 'coffee', unlocksEvent: 'slope',   speedMultiplier: 1.15 },
  { id: 'bujang',        name: '부장',        world: 'company',  cumulativeDays: 10, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.2  },
  { id: 'sangmu',        name: '상무',        world: 'company',  cumulativeDays: 13, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.25 },
  // ── 정치 (politics) ─────────────────────────────────────────────────────────
  { id: 'hoejang',       name: '회장',        world: 'politics', cumulativeDays: 15, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.3  },
  { id: 'chongsu',       name: '총수',        world: 'politics', cumulativeDays: 18, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.35 },
  { id: 'gukhoe',        name: '국회의원',    world: 'politics', cumulativeDays: 21, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.4  },
  { id: 'daetongryeong', name: '대통령',      world: 'politics', cumulativeDays: 24, item: 'coffee', unlocksEvent: undefined, speedMultiplier: 1.45 },
  // ── 이세계 (isekai) ──────────────────────────────────────────────────────────
  { id: 'yongsa',        name: '신입용사',    world: 'isekai',   cumulativeDays: 25, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.5  },
  { id: 'gisa',          name: '기사',        world: 'isekai',   cumulativeDays: 28, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.55 },
  { id: 'mabeopsa',      name: '마법사',      world: 'isekai',   cumulativeDays: 31, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.6  },
  { id: 'hyeonja',       name: '현자',        world: 'isekai',   cumulativeDays: 34, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.65 },
  { id: 'yeongung',      name: '영웅',        world: 'isekai',   cumulativeDays: 37, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.7  },
  { id: 'mawang',        name: '마왕',        world: 'isekai',   cumulativeDays: 40, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.75 },
  { id: 'sin',           name: '신',          world: 'isekai',   cumulativeDays: 44, item: 'sword',  unlocksEvent: undefined, speedMultiplier: 1.8  },
  // ── 우주 (space) ─────────────────────────────────────────────────────────────
  { id: 'ujuin',         name: '신입우주인',  world: 'space',    cumulativeDays: 45, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 1.85 },
  { id: 'dal',           name: '달탐험가',    world: 'space',    cumulativeDays: 48, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 1.9  },
  { id: 'hwaseong',      name: '화성탐험가',  world: 'space',    cumulativeDays: 51, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 1.95 },
  { id: 'geumseong',     name: '금성탐험가',  world: 'space',    cumulativeDays: 54, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 2.0  },
  { id: 'mokseong',      name: '목성탐험가',  world: 'space',    cumulativeDays: 57, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 2.05 },
  { id: 'cheonwang',     name: '천왕성탐험가', world: 'space',   cumulativeDays: 59, item: 'flag',   unlocksEvent: undefined, speedMultiplier: 2.1  },
];

export const LOOP_CYCLE_DAYS = 60;

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
