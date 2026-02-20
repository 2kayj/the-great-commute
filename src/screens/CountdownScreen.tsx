import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Physics } from '../engine/Physics';
import { CharacterRenderer } from '../engine/CharacterRenderer';
import { BackgroundRenderer } from '../engine/BackgroundRenderer';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  CHARACTER_X,
} from '../utils/constants';
import './CountdownScreen.css';

// Visible canvas fills the full screen
const PREVIEW_W = 390;
const PREVIEW_H = 844;

const MESSAGES: Record<number, { main: string; sub: string }> = {
  3: { main: '신입을 출근시켜 주세요!', sub: '화면 좌/우를 탭해 균형을 잡아요' },
  2: { main: '커피 들고 출발!',   sub: '커피 쏟지 마세요!' },
  1: { main: '이제 진짜 출발이에요!',           sub: '집중하세요!' },
};

export const CountdownScreen: React.FC = () => {
  const { setPhase } = useGameStore();
  const [count, setCount] = useState<number | 'GO'>(3);
  const [flash, setFlash] = useState(false);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const charRef     = useRef((() => {
    const cr = new CharacterRenderer();
    cr.warmUp(CHARACTER_X, GROUND_Y);
    return cr;
  })());
  const bgRef       = useRef(new BackgroundRenderer());
  const physicsRef  = useRef(new Physics());
  const lastTimeRef = useRef(0);

  // Countdown logic
  useEffect(() => {
    let current = 3;
    setCount(3);

    const doFlash = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 180);
    };

    doFlash();

    const interval = setInterval(() => {
      current--;
      if (current === 0) {
        clearInterval(interval);
        setTimeout(() => {
          setCount('GO');
          doFlash();
          setTimeout(() => setPhase('playing'), 700);
        }, 1000);
        return;
      }
      setCount(current);
      doFlash();
    }, 1000);

    return () => clearInterval(interval);
  }, [setPhase]);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = PREVIEW_W * dpr;
    canvas.height = PREVIEW_H * dpr;
    canvas.style.width  = `${PREVIEW_W}px`;
    canvas.style.height = `${PREVIEW_H}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Full-resolution offscreen for rendering
    const offscreen = document.createElement('canvas');
    offscreen.width  = CANVAS_WIDTH;
    offscreen.height = CANVAS_HEIGHT;
    const offCtx = offscreen.getContext('2d')!;

    const char    = charRef.current;
    const bg      = bgRef.current;
    const physics = physicsRef.current;

    physics.reset();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - (lastTimeRef.current || timestamp)) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      physics.update(dt, 0);
      const state = physics.getState();

      bg.update(dt, state.speed, 0);
      char.update(CHARACTER_X, GROUND_Y, state.walkPhase, 0, dt, false, state.speed);

      offCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      bg.render(offCtx);
      char.render(offCtx, CHARACTER_X, GROUND_Y, 0, state.walkPhase, false);

      // Scale offscreen (390x844) → preview (390x844) — 1:1 here, but DPR handled
      ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
      ctx.drawImage(offscreen, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, 0, PREVIEW_W, PREVIEW_H);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const isGo = count === 'GO';
  const msg  = typeof count === 'number' ? MESSAGES[count] : null;

  return (
    <div className={`countdown-screen ${flash ? 'do-flash' : ''}`}>

      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="cd-canvas" />

      {/* Countdown overlay — DOM on top of canvas */}
      <div className="cd-center">
        {!isGo && <div className="ready-label">READY?</div>}

        <div className={`number-box ${isGo ? 'number-box--go' : ''} ${count === 1 ? 'number-box--danger' : ''}`}>
          {!isGo ? (
            <span key={String(count)} className="count-number">{count}</span>
          ) : (
            <span className="go-text">GO!</span>
          )}
        </div>

        {msg && (
          <div className="cd-msg">
            <div className="msg-main">{msg.main}</div>
            <div className="msg-sub">{msg.sub}</div>
          </div>
        )}
        {isGo && (
          <div className="cd-msg">
            <div className="msg-main">출발!</div>
            <div className="msg-sub">균형을 잡으며 오피스까지 달려가요!</div>
          </div>
        )}
      </div>
    </div>
  );
};
