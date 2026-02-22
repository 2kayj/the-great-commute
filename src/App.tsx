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
      // visualViewport.height reflects the actual visible area on iOS Safari,
      // excluding browser chrome (address bar / toolbar). Falls back to
      // window.innerHeight on browsers that don't support visualViewport.
      const vh = window.visualViewport?.height ?? window.innerHeight;

      const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);

      const scaledW = DESIGN_W * scale;
      const scaledH = DESIGN_H * scale;

      const offsetX = (vw - scaledW) / 2;
      // Use visualViewport.offsetTop to account for any vertical offset
      // introduced by the iOS Safari address bar when it is partially shown.
      const vpOffsetTop = window.visualViewport?.offsetTop ?? 0;
      const offsetY = vpOffsetTop + (vh - scaledH) / 2;

      el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    };

    applyScale();

    window.addEventListener('resize', applyScale);
    // visualViewport resize fires more reliably than window resize on iOS Safari
    // when the address bar shows/hides.
    window.visualViewport?.addEventListener('resize', applyScale);
    window.visualViewport?.addEventListener('scroll', applyScale);

    return () => {
      window.removeEventListener('resize', applyScale);
      window.visualViewport?.removeEventListener('resize', applyScale);
      window.visualViewport?.removeEventListener('scroll', applyScale);
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
