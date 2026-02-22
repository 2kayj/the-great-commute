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
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyLayout = () => {
      const el = gameContainerRef.current;
      if (!el) return;

      // visualViewport 우선, 없으면 innerWidth/Height
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;

      // 최소 크기 이하이면 고정 (스케일 없이 그대로)
      if (vw <= DESIGN_W && vh <= DESIGN_H) {
        el.style.width = `${DESIGN_W}px`;
        el.style.height = `${DESIGN_H}px`;
        el.style.transform = 'translate(-50%, -50%)';
        return;
      }

      // 높이 기준으로 scale 계산 (높이 우선 꽉 채우기)
      const scaleByH = vh / DESIGN_H;
      const scaledW = DESIGN_W * scaleByH;

      let scale: number;
      if (scaledW <= vw) {
        // 높이 기준으로 꽉 채워도 너비가 화면 안에 들어옴 → letterbox
        scale = scaleByH;
      } else {
        // 너비 기준으로 축소해야 함
        scale = vw / DESIGN_W;
      }

      el.style.width = `${DESIGN_W}px`;
      el.style.height = `${DESIGN_H}px`;
      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };

    applyLayout();

    window.addEventListener('resize', applyLayout);
    // visualViewport resize fires more reliably than window resize on iOS Safari
    // when the address bar shows/hides.
    window.visualViewport?.addEventListener('resize', applyLayout);

    return () => {
      window.removeEventListener('resize', applyLayout);
      window.visualViewport?.removeEventListener('resize', applyLayout);
    };
  }, []);

  return (
    <div className="app-wrapper">
      <div className="game-container" ref={gameContainerRef}>
        {phase === 'ready'     && <StartScreen />}
        {phase === 'countdown' && <CountdownScreen />}
        {(phase === 'playing' || phase === 'stage-transition') && <GameScreen />}
        {phase === 'over'      && <GameOverScreen />}
      </div>
    </div>
  );
};

export default App;
