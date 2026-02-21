import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useRecordStore } from '../store/recordStore';
import { CharacterRenderer } from '../engine/CharacterRenderer';
import { BackgroundRenderer } from '../engine/BackgroundRenderer';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  CHARACTER_X,
} from '../utils/constants';
import './StartScreen.css';

// Preview canvas logical width (height is determined by scene-area container at runtime)
const PREVIEW_W = 390;

// How many px above GROUND_Y we want to show in the preview.
// Buildings can be up to ~260px tall (GROUND_Y - 260 = 460).
// We crop from (GROUND_Y - CROP_ABOVE_GROUND) to (GROUND_Y + CROP_BELOW_GROUND).
const CROP_ABOVE_GROUND = 310; // show 310px of building above ground line
const CROP_BELOW_GROUND = 20;  // show ground + a bit of pavement below
const CROP_TOTAL = CROP_ABOVE_GROUND + CROP_BELOW_GROUND; // 330px default

export const StartScreen: React.FC = () => {
  const { setPhase }     = useGameStore();
  const { bestDistance } = useRecordStore();

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const sceneAreaRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const charRef      = useRef((() => {
    const cr = new CharacterRenderer();
    cr.warmUp(CHARACTER_X, GROUND_Y);
    return cr;
  })());
  const bgRef        = useRef(new BackgroundRenderer());
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const walkPhaseRef = useRef(0);
  const lastTimeRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Read actual scene-area container height to support responsive layouts
    const containerH = sceneAreaRef.current?.clientHeight ?? CROP_TOTAL;
    const previewH = containerH > 0 ? containerH : CROP_TOTAL;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = PREVIEW_W * dpr;
    canvas.height = previewH * dpr;
    canvas.style.width  = `${PREVIEW_W}px`;
    canvas.style.height = `${previewH}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Offscreen canvas at full game resolution
    const offscreen = document.createElement('canvas');
    offscreen.width  = CANVAS_WIDTH;
    offscreen.height = CANVAS_HEIGHT;
    offscreenRef.current = offscreen;
    const offCtx = offscreen.getContext('2d')!;

    const char = charRef.current;
    const bg   = bgRef.current;

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - (lastTimeRef.current || timestamp)) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      walkPhaseRef.current += dt * 2.2;

      bg.update(dt, 80, 0);
      char.update(CHARACTER_X, GROUND_Y, walkPhaseRef.current, 0, dt, false, 80);

      // Render to offscreen at full resolution
      offCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      bg.render(offCtx);
      char.render(offCtx, CHARACTER_X, GROUND_Y, 0, walkPhaseRef.current, false);

      // Crop: show the window that includes buildings + character + ground.
      // srcY starts CROP_ABOVE_GROUND px above GROUND_Y.
      const srcY = GROUND_Y - CROP_ABOVE_GROUND;

      ctx.clearRect(0, 0, PREVIEW_W, previewH);
      ctx.drawImage(
        offscreen,
        0,           srcY,        // source origin
        CANVAS_WIDTH, CROP_TOTAL, // source size  (390 x CROP_TOTAL)
        0, 0,                     // dest origin
        PREVIEW_W,   previewH    // dest size    (fits container)
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="start-screen">

      {/* ── 타이틀 영역 ── */}
      <div className="title-area">
        <div className="game-title">
          <span className="underline-hand">허약 신입</span>
          <br />
          출근 대작전
        </div>
        <div className="game-english-title">The Great Commute</div>
      </div>

      {/* ── 애니메이션 캔버스 영역 ── */}
      <div className="scene-area" ref={sceneAreaRef}>
        <canvas ref={canvasRef} className="preview-canvas" />
      </div>

      {/* ── 하단 UI 영역 ── */}
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

        <button className="btn-start" onClick={() => setPhase('countdown')}>
          시작하기!
        </button>
      </div>
    </div>
  );
};
