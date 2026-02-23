import React, { useEffect, useCallback } from 'react';
import type { RankDef } from '../types/rank.types';
import './PromotionScreen.css';

const WORLD_LABELS: Record<string, string> = {
  company:  '직장인의 세계',
  politics: '정치의 세계',
  isekai:   '이세계',
  space:    '우주의 세계',
};

const WORLD_CONGRATS: Record<string, string> = {
  company:  '승진을 해버렸다',
  politics: '출세를 해버렸다',
  isekai:   '레벨업을 해버렸다',
  space:    '새 행성에 도착해버렸다',
};

const CONFETTI_COLORS = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
  '#FF6FC8', '#A78BFA', '#F97316', '#14B8A6',
];

// Generate stable confetti pieces
const CONFETTI_COUNT = 30;
const confettiPieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
  id: i,
  left: (i / CONFETTI_COUNT) * 100,
  delay: (i % 10) * 0.2,
  duration: 2.5 + (i % 5) * 0.3,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + (i % 4) * 2,
  drift: -30 + (i % 7) * 10,
}));

interface Props {
  rank: RankDef;
  loopCount: number;
  onComplete: () => void;
}

export const PromotionScreen: React.FC<Props> = ({ rank, loopCount, onComplete }) => {
  const rankStars = loopCount > 0 ? '★'.repeat(loopCount) : '';
  const worldLabel = WORLD_LABELS[rank.world] ?? rank.world;

  const dismiss = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`promotion-screen promotion-screen--${rank.world}`}
      onClick={dismiss}
    >
      {/* Confetti */}
      <div className="promotion-confetti" aria-hidden="true">
        {confettiPieces.map((p) => (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Content */}
      <div className="promotion-content">
        <div className="promotion-congrats">
          꾸준히 출근했더니<br />{WORLD_CONGRATS[rank.world] ?? '승진을 해버렸다'}
        </div>
        <div className="promotion-rank-name">
          {rankStars}{rank.name}
        </div>
        <div className="promotion-world">{worldLabel}</div>
        <div className="promotion-hint">탭하여 계속</div>
      </div>
    </div>
  );
};
