import React, { useEffect, useState } from 'react';
import './StageTransitionOverlay.css';

interface Props {
  dayNumber: number;
  onComplete: () => void;
}

const DAY_LABELS: Record<number, string> = {
  1: '첫째날',
  2: '둘째날',
  3: '셋째날',
  4: '넷째날',
  5: '다섯째날',
  6: '여섯째날',
  7: '일곱째날',
};

function getDayLabel(day: number): string {
  return DAY_LABELS[day] ?? `${day}째날`;
}

export const StageTransitionOverlay: React.FC<Props> = ({ dayNumber, onComplete }) => {
  const [phase, setPhase] = useState<'fadeout' | 'text' | 'fadein'>('fadeout');

  useEffect(() => {
    // Phase 1: fade out (0.8s)
    const t1 = setTimeout(() => setPhase('text'), 800);
    // Phase 2: show text (1.5s)
    const t2 = setTimeout(() => setPhase('fadein'), 2300);
    // Phase 3: fade in (0.8s), then complete
    const t3 = setTimeout(() => onComplete(), 3100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className={`stage-transition stage-transition--${phase}`}>
      <div className="stage-transition__content">
        <div className="stage-transition__day">출근 {getDayLabel(dayNumber)}</div>
        <div className="stage-transition__sub">난이도 UP!</div>
      </div>
    </div>
  );
};
