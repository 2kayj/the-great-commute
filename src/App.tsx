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
      if (window.innerWidth > 430) return;

      const el = innerRef.current;
      if (!el) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);

      const scaledW = DESIGN_W * scale;
      const scaledH = DESIGN_H * scale;

      const offsetX = (vw - scaledW) / 2;
      const offsetY = (vh - scaledH) / 2;

      el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    };

    applyScale();

    window.addEventListener('resize', applyScale);
    return () => {
      window.removeEventListener('resize', applyScale);
    };
  }, []);

  return (
    <div className="app-wrapper">
      <div className="phone-frame">
        <div className="inner-container" ref={innerRef}>
          {phase === 'ready'     && <StartScreen />}
          {phase === 'countdown' && <CountdownScreen />}
          {(phase === 'playing' || phase === 'stage-transition') && <GameScreen />}
          {phase === 'over'      && <GameOverScreen />}
        </div>
      </div>
    </div>
  );
};

export default App;
