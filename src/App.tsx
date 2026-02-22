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
  const appWrapperRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyLayout = () => {
      const wrapper = appWrapperRef.current;
      const el = gameContainerRef.current;
      if (!wrapper || !el) return;

      // visualViewport 우선, 없으면 innerWidth/Height
      // visualViewport는 iOS Safari에서 주소창을 제외한 실제 가시 영역을 반환함
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;

      // app-wrapper 높이를 vh로 직접 설정 → top: 50%의 기준을 vh와 일치시킴
      wrapper.style.height = `${vh}px`;

      // 항상 scale 계산: 높이와 너비 중 작은 비율 사용
      const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);

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
    <div className="app-wrapper" ref={appWrapperRef}>
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
