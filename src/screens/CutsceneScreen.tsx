import React, { useEffect, useCallback, useRef, useState } from 'react';
import './CutsceneScreen.css';

export type CutsceneType = 'isekai' | 'space' | 'dream';

interface Props {
  type: CutsceneType;
  loopCount?: number;
  onComplete: () => void;
}

// ---------------------------------------------------------------------------
// Star data for the space cutscene — generated once, stable across renders
// ---------------------------------------------------------------------------
const STAR_COUNT = 60;
const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  top:    `${Math.floor((i * 17 + 5) % 100)}%`,
  left:   `${Math.floor((i * 31 + 11) % 100)}%`,
  size:   1 + (i % 3),
  opacity: 0.4 + (i % 5) * 0.12,
  twinkleDur:   `${1.5 + (i % 4) * 0.5}s`,
  twinkleDelay: `${(i % 7) * 0.2}s`,
}));

// ---------------------------------------------------------------------------
// Sub-components for each cutscene type
// ---------------------------------------------------------------------------

// Reusable stick figure used in both isekai and space scenes
const StickFigure: React.FC<{ extraClass?: string }> = ({ extraClass = '' }) => (
  <div className={`${extraClass}`}>
    <div className="stick-head" />
    <div className="stick-body" />
    <div className="stick-arm-l" />
    <div className="stick-arm-r" />
    <div className="stick-leg-l" />
    <div className="stick-leg-r" />
  </div>
);

// ---- Isekai ----------------------------------------------------------------
const IsekaiCutscene: React.FC<{ phase: number; onTap: () => void }> = ({ phase, onTap }) => (
  <div className={`cutscene cutscene--isekai phase-${phase}`} onClick={onTap}>
    {/* Phase 1-2: Walking scene */}
    {phase <= 2 && (
      <div className="isekai-scene">
        <div className="isekai-ground" />
        <StickFigure extraClass="isekai-character" />
        {/* Phase 2: truck slides in */}
        {phase === 2 && (
          <div className="isekai-truck">
            <div className="truck-body">
              <div className="truck-cab" />
            </div>
            <div className="truck-wheels">
              <div className="truck-wheel" />
              <div className="truck-wheel" />
              <div className="truck-wheel" />
            </div>
          </div>
        )}
      </div>
    )}

    {/* Phase 3: white flash */}
    {phase === 3 && (
      <div className="isekai-scene">
        <div className="isekai-flash" />
      </div>
    )}

    {/* Phase 4: isekai world reveal */}
    {phase === 4 && (
      <div className="isekai-final">
        <div className="isekai-final-text">출근 길 트럭에 치여 눈을 떠보니...<br />이세계 신입용사가 되어버렸다</div>
        <div className="cutscene-hint">탭하여 계속</div>
      </div>
    )}
  </div>
);

// ---- Space -----------------------------------------------------------------
const SpaceCutscene: React.FC<{ phase: number; onTap: () => void }> = ({ phase, onTap }) => (
  <div className="cutscene cutscene--space" onClick={onTap}>
    {/* Sky + stars backdrop */}
    <div className="space-sky" />
    <div className="space-stars" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="space-star"
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            '--star-opacity': s.opacity,
            '--twinkle-dur': s.twinkleDur,
            '--twinkle-delay': s.twinkleDelay,
          } as React.CSSProperties}
        />
      ))}
    </div>

    {/* Phase 1: character ascends */}
    {phase === 1 && (
      <div className="space-scene">
        <div className="space-ground" />
        <StickFigure extraClass="space-character" />
      </div>
    )}

    {/* Phase 2: large text line 1 */}
    {phase === 2 && (
      <div className="space-text-screen">
        <div className="space-text-line1">이세계에서도<br />출근했더니...</div>
      </div>
    )}

    {/* Phase 3: text line 2 + hint */}
    {phase === 3 && (
      <div className="space-text-screen">
        <div className="space-text-line1">이세계에서도<br />출근했더니...</div>
        <div className="space-text-line2">우주로 날아오게 되었다</div>
        <div className="cutscene-hint">탭하여 계속</div>
      </div>
    )}
  </div>
);

// ---- Dream -----------------------------------------------------------------
const DreamCutscene: React.FC<{ phase: number; loopCount: number; onTap: () => void }> = ({ phase, loopCount, onTap }) => (
  <div className="cutscene cutscene--dream" onClick={onTap}>
    {/* Phase 1: blur overlay (화면 전환 효과) */}
    {phase === 1 && <div className="dream-blur-overlay" />}

    {/* Phase 2: 빛/포털 느낌 연출 */}
    {phase === 2 && (
      <div className="dream-alarm">
        <div className="alarm-text">번쩍!</div>
      </div>
    )}

    {/* Phase 3: 회귀 메시지 line 1 */}
    {phase === 3 && (
      <div className="dream-text-screen">
        <div className="dream-text-line1">우주에서 꾸준히 출근했더니...</div>
      </div>
    )}

    {/* Phase 4: final line + hint */}
    {phase === 4 && (
      <div className="dream-text-screen">
        <div className="dream-text-line1">우주에서 꾸준히 출근했더니...</div>
        <div className="dream-text-line2">{loopCount + 1}회차 삶의 기회가 주어졌다</div>
        <div className="cutscene-hint" style={{ color: 'rgba(0,0,0,0.4)' }}>탭하여 계속</div>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Cutscene timing tables
// Each entry: [duration in ms] for that phase before advancing to next
// ---------------------------------------------------------------------------
const TIMINGS: Record<CutsceneType, number[]> = {
  //         phase1  phase2  phase3  phase4(final)
  isekai: [  1500,   1000,   1000,   99999 ],  // final phase waits for tap
  space:  [  2000,   1500,   99999,  0     ],  // phase3 is final
  dream:  [  1500,   1500,   1500,   99999 ],  // phase4 is final
};

// ---------------------------------------------------------------------------
// Main CutsceneScreen
// ---------------------------------------------------------------------------
export const CutsceneScreen: React.FC<Props> = ({ type, loopCount = 0, onComplete }) => {
  // phase starts at 1 (not 0) — matches the sub-component phase numbering
  const [phase, setPhase] = useState(1);
  const phaseRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timings = TIMINGS[type];
  const finalPhase = timings.length; // isekai=4, space=3, dream=4

  const advancePhase = useCallback(() => {
    const next = phaseRef.current + 1;
    if (next > finalPhase) return;
    phaseRef.current = next;
    setPhase(next);
  }, [finalPhase]);

  // Auto-advance through phases
  useEffect(() => {
    phaseRef.current = phase;

    // If this is the final phase, don't auto-advance (wait for tap)
    const delay = timings[phase - 1];
    if (delay === 99999) return;

    timerRef.current = setTimeout(() => {
      advancePhase();
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, timings, advancePhase]);

  // Tap handler: skip to final phase, or complete if already there
  const handleTap = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (phaseRef.current >= finalPhase) {
      onComplete();
    } else {
      // Jump to final phase
      phaseRef.current = finalPhase;
      setPhase(finalPhase);
    }
  }, [finalPhase, onComplete]);

  if (type === 'isekai') return <IsekaiCutscene phase={phase} onTap={handleTap} />;
  if (type === 'space')  return <SpaceCutscene  phase={phase} onTap={handleTap} />;
  return                        <DreamCutscene  phase={phase} loopCount={loopCount} onTap={handleTap} />;
};
