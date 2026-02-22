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

      // visualViewport 우선 사용: iOS Safari에서 주소창을 제외한 실제 가시 영역
      // 없으면 innerWidth/Height 폴백
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;

      // wrapper를 실제 가시 영역 크기로 고정
      // position: fixed 대신 인라인 스타일로 정확한 픽셀값 지정
      wrapper.style.width = `${vw}px`;
      wrapper.style.height = `${vh}px`;

      // contain 방식: 가로/세로 모두 넘치지 않는 최대 스케일
      // 모바일(세로형): vh/DESIGN_H 기준이 대부분 맞음
      // 모바일(가로형) 또는 데스크톱: vw/DESIGN_W가 작을 수 있음
      const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);

      el.style.width = `${DESIGN_W}px`;
      el.style.height = `${DESIGN_H}px`;
      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };

    applyLayout();

    window.addEventListener('resize', applyLayout);
    // visualViewport resize: iOS Safari에서 주소창 표시/숨김 시 안정적으로 발화
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
