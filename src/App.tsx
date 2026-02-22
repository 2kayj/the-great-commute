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

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
      const scaledW = DESIGN_W * scale;
      const scaledH = DESIGN_H * scale;

      el.style.left = `${(vw - scaledW) / 2}px`;
      el.style.top = `${(vh - scaledH) / 2}px`;
      el.style.transform = `scale(${scale})`;
    };

    applyLayout();
    window.addEventListener('resize', applyLayout);
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
