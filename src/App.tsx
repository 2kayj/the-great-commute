import React, { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { StartScreen } from './screens/StartScreen';
import { CountdownScreen } from './screens/CountdownScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import './App.css';

const DESIGN_W = 390;
const DESIGN_H = 844;

const App: React.FC = () => {
  const { phase } = useGameStore();
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyScale = () => {
      // 모바일(430px 이하)에서만 scale 적용
      if (window.innerWidth > 430) return;

      const el = innerRef.current;
      if (!el) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // object-fit: contain 효과 — 비율을 유지하며 뷰포트에 맞춤
      const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);

      // scale 후 실제 점유 크기
      const scaledW = DESIGN_W * scale;
      const scaledH = DESIGN_H * scale;

      // 중앙 정렬을 위한 오프셋 (transform-origin: top left 기준)
      const offsetX = (vw - scaledW) / 2;
      const offsetY = (vh - scaledH) / 2;

      el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    };

    applyScale();

    window.addEventListener('resize', applyScale);
    // orientationchange 후에는 resize가 뒤따라 발생하므로 별도 처리 불필요
    return () => {
      window.removeEventListener('resize', applyScale);
    };
  }, []);

  return (
    <div className="app-wrapper">
      <div className="phone-frame">
        {/* inner-container: 항상 390x844, 모바일에서 scale transform 적용 */}
        <div className="inner-container" ref={innerRef}>
          {phase === 'ready'     && <StartScreen />}
          {phase === 'countdown' && <CountdownScreen />}
          {phase === 'playing'   && <GameScreen />}
          {phase === 'over'      && <GameOverScreen />}
        </div>
      </div>
    </div>
  );
};

export default App;
