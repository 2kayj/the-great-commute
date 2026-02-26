import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useRecordStore } from '../store/recordStore';
import { useStageStore } from '../store/stageStore';
import { CharacterRenderer } from '../engine/CharacterRenderer';
import { BackgroundRenderer } from '../engine/BackgroundRenderer';
import {
  GROUND_Y,
  CHARACTER_X,
} from '../utils/constants';
import {
  makeCompanyTheme,
  PoliticsTheme,
  IsekaiTheme,
  makeSpaceTheme,
} from '../engine/themes';
import type { BackgroundTheme } from '../engine/themes';
import './StartScreen.css';

// Theme cycle: company → politics → isekai → space → loop
const THEME_CYCLE: BackgroundTheme[] = [
  makeCompanyTheme('gwajang'),  // sunset orange — visually striking opener
  PoliticsTheme,
  IsekaiTheme,
  makeSpaceTheme('moon'),
];

// How long each theme is shown (seconds)
const THEME_DURATION = 5.0;
// Crossfade duration between themes (seconds)
const FADE_DURATION = 1.0;

// Scroll speed for the preview (px/s)
const PREVIEW_SPEED = 80;

export const StartScreen: React.FC = () => {
  const { setPhase }                          = useGameStore();
  const { bestDistance }                      = useRecordStore();
  const { loopCount, currentDay, resetStage } = useStageStore();

  const isResuming = currentDay > 1;

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);

  // Character renderer — warmed up so Verlet chains are already settled
  const charRef = useRef((() => {
    const cr = new CharacterRenderer();
    cr.warmUp(CHARACTER_X, GROUND_Y);
    return cr;
  })());

  // Current theme background renderer
  const bgRef = useRef(new BackgroundRenderer());

  // Next theme background renderer (used during crossfade)
  const nextBgRef = useRef<BackgroundRenderer | null>(null);

  // Per-frame state refs
  const walkPhaseRef    = useRef(0);
  const lastTimeRef     = useRef(0);
  const themeIndexRef   = useRef(0);
  const themeElapsedRef = useRef(0);  // time spent in current theme
  const fadeProgressRef = useRef(1);  // 0 = full crossfade in progress, 1 = solid

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;

    // Apply initial theme
    bgRef.current.setTheme(THEME_CYCLE[0]!);

    // Size the canvas to fill the container (root div), then scale the draw context
    // so all renderer coordinates (0…CANVAS_WIDTH × 0…CANVAS_HEIGHT) map
    // proportionally into the container — keeping GROUND_Y and CANVAS_HEIGHT valid.
    const applySize = () => {
      const screenW = container.clientWidth;
      const screenH = container.clientHeight;

      canvas.width  = screenW * dpr;
      canvas.height = screenH * dpr;
      canvas.style.width  = `${screenW}px`;
      canvas.style.height = `${screenH}px`;
    };

    applySize();

    const resizeObserver = new ResizeObserver(() => {
      applySize();
    });
    resizeObserver.observe(container);

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - (lastTimeRef.current || timestamp)) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      // Advance walk phase and theme timer
      walkPhaseRef.current    += dt * 2.2;
      themeElapsedRef.current += dt;

      // ── Theme cycling logic ──────────────────────────────────────────────
      const elapsed = themeElapsedRef.current;

      if (elapsed >= THEME_DURATION && fadeProgressRef.current >= 1) {
        // Start a crossfade to the next theme
        fadeProgressRef.current = 0;

        const nextIndex = (themeIndexRef.current + 1) % THEME_CYCLE.length;
        const nextBg = new BackgroundRenderer();
        nextBg.setTheme(THEME_CYCLE[nextIndex]!);
        nextBgRef.current = nextBg;
      }

      if (fadeProgressRef.current < 1) {
        fadeProgressRef.current = Math.min(
          fadeProgressRef.current + dt / FADE_DURATION,
          1
        );
        // When fade completes, swap renderers
        if (fadeProgressRef.current >= 1 && nextBgRef.current) {
          bgRef.current     = nextBgRef.current;
          nextBgRef.current = null;
          themeIndexRef.current   = (themeIndexRef.current + 1) % THEME_CYCLE.length;
          themeElapsedRef.current = 0;
        }
      }

      // ── Update engines ────────────────────────────────────────────────────
      bgRef.current.update(dt, PREVIEW_SPEED, 0);
      if (nextBgRef.current) {
        nextBgRef.current.update(dt, PREVIEW_SPEED, 0);
      }

      charRef.current.update(
        CHARACTER_X,
        GROUND_Y,
        walkPhaseRef.current,
        0,
        dt,
        false,
        PREVIEW_SPEED
      );

      // ── Render ────────────────────────────────────────────────────────────
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const screenW = container.clientWidth;
      const screenH = container.clientHeight;

      ctx.save();
      ctx.clearRect(0, 0, screenW * dpr, screenH * dpr);

      // Uniform scale (no distortion). Show the bottom portion of the
      // 390×844 scene so the ground + character are visible with sky above.
      ctx.scale(dpr, dpr);
      const offsetY = Math.max(0, GROUND_Y - screenH * 0.65);
      ctx.translate(0, -offsetY);

      // Render current theme at full opacity
      if (nextBgRef.current && fadeProgressRef.current < 1) {
        // During fade: render both; incoming theme overlays with increasing alpha
        bgRef.current.render(ctx);
        ctx.save();
        ctx.globalAlpha = fadeProgressRef.current;
        nextBgRef.current.render(ctx);
        ctx.restore();
      } else {
        bgRef.current.render(ctx);
      }

      // Character on top of background
      charRef.current.render(ctx, CHARACTER_X, GROUND_Y, 0, walkPhaseRef.current, false);

      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="start-screen" ref={containerRef}>
      {/* Full-screen background canvas */}
      <canvas ref={canvasRef} className="start-bg-canvas" />

      {/* Foreground UI overlay */}
      <div className="start-ui">

        {/* Title */}
        <div className="title-area">
          <div className="game-title">
            <span className="underline-hand">허약 신입</span>
            <br />
            출근 대작전
          </div>
          <div className="game-english-title">The Great Commute</div>
        </div>

        {/* Spacer — pushes bottom-area down */}
        <div className="start-middle" />

        {/* Bottom UI */}
        <div className="bottom-area">
          <div className="record-box">
            <div>
              <div className="record-label">최고 기록</div>
              <div>
                <span className="record-value">{bestDistance}</span>
                <span className="record-unit">m</span>
              </div>
            </div>
            <div className="record-crown">
              <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
                <path d="M 2,20 L 4,10 L 9,16 L 14,6 L 19,16 L 24,10 L 26,20 Z"
                      fill="#FFD700" stroke="#222" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="tip-box">
            <div className="tip-text">
              화면 <strong>좌/우를 탭</strong>해서 균형을 잡아요.
              <br />
              신입을 출근시켜 주세요!
            </div>
          </div>

          {loopCount > 0 && (
            <div className="loop-indicator">
              {'★'.repeat(loopCount)} {loopCount}회차
            </div>
          )}

          {isResuming && (
            <div className="resume-indicator">
              Day {currentDay}부터 이어서
            </div>
          )}

          <button className="btn-start" onClick={() => setPhase('countdown')}>
            {isResuming ? '이어서 출근!' : '시작하기!'}
          </button>

          {isResuming && (
            <button className="btn-reset-link" onClick={() => resetStage()}>
              처음부터 다시 시작하기
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
