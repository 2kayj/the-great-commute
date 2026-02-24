import React, { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { StartScreen } from './screens/StartScreen';
import { CountdownScreen } from './screens/CountdownScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import AssetPreview from './pages/AssetPreview';
import platform from './platform';
import './App.css';

const DESIGN_W = 390;
const DESIGN_H = 844;

// Show asset preview when URL contains ?preview
const isPreviewMode = new URLSearchParams(window.location.search).has('preview');

const App: React.FC = () => {
  const { phase } = useGameStore();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 토스 플랫폼은 동적 로드 후 자동 초기화됨 (platform/index.ts)
    if (platform.PLATFORM !== 'toss') {
      platform.initAds();
      platform.restorePendingPurchases();
    }
  }, []);

  useEffect(() => {
    if (isPreviewMode) return;
    const applyLayout = () => {
      const el = gameContainerRef.current;
      if (!el) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // safe-area 읽기 (상태바/노치 영역)
      const style = getComputedStyle(document.documentElement);
      const safeTop = parseFloat(style.getPropertyValue('--sat')) || 0;
      const safeBottom = parseFloat(style.getPropertyValue('--sab')) || 0;

      // safe-area 제외한 실제 사용 가능 영역
      const availH = vh - safeTop - safeBottom;

      const scale = Math.min(vw / DESIGN_W, availH / DESIGN_H);
      const scaledW = DESIGN_W * scale;
      const scaledH = DESIGN_H * scale;

      el.style.left = `${(vw - scaledW) / 2}px`;
      el.style.top = `${safeTop + (availH - scaledH) / 2}px`;
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

  if (isPreviewMode) {
    return <AssetPreview />;
  }

  return (
    <div className="app-wrapper">
      <div className="game-container" ref={gameContainerRef}>
        {phase === 'ready'     && <StartScreen />}
        {phase === 'countdown' && <CountdownScreen />}
        {(phase === 'playing' || phase === 'stage-transition' || phase === 'promotion' || phase === 'cutscene') && <GameScreen />}
        {phase === 'over'      && <GameOverScreen />}
      </div>
    </div>
  );
};

export default App;
