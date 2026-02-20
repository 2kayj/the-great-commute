import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useRecordStore } from '../store/recordStore';
import { GameLoop } from '../engine/GameLoop';
import { Physics } from '../engine/Physics';
import { CharacterRenderer } from '../engine/CharacterRenderer';
import { BackgroundRenderer } from '../engine/BackgroundRenderer';
import { InputManager } from '../engine/InputManager';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CHARACTER_X, GROUND_Y } from '../utils/constants';
import './GameScreen.css';

const SPEECH_MESSAGES: Record<number, string> = {
  10:  '출근하기 싫다...',
  20:  '왜 이렇게 멀어...',
  30:  '커피 쏟으면 죽는다',
  40:  '아 다리 풀려...',
  50:  '지각이다 지각!!',
  60:  '팀장님 제발...',
  70:  '월급이 적어...',
  80:  '오늘도 야근인가',
  90:  '퇴사할까...',
  100: '100m 돌파!!',
};
const SPEECH_POOL = Object.values(SPEECH_MESSAGES);

export const GameScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const gameLoopRef       = useRef<GameLoop | null>(null);
  const physicsRef        = useRef<Physics>(new Physics());
  const characterRef      = useRef<CharacterRenderer>((() => {
    const cr = new CharacterRenderer();
    cr.warmUp(CHARACTER_X, GROUND_Y);
    return cr;
  })());
  const backgroundRef     = useRef<BackgroundRenderer>(new BackgroundRenderer());
  const inputRef          = useRef<InputManager>(new InputManager());
  const directionRef      = useRef<-1 | 0 | 1>(0);
  const gameOverFiredRef  = useRef<boolean>(false);
  const gameOverTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setPhase, setDistance, setIsNewRecord } = useGameStore();
  const { bestDistance, submitRecord } = useRecordStore();
  const bestDistRef = useRef(bestDistance);
  bestDistRef.current = bestDistance;

  // Stable refs for store actions — prevents useEffect from re-running
  // when Zustand returns new function references across renders.
  const setPhaseRef       = useRef(setPhase);
  const setDistanceRef    = useRef(setDistance);
  const setIsNewRecordRef = useRef(setIsNewRecord);
  const submitRecordRef   = useRef(submitRecord);
  setPhaseRef.current       = setPhase;
  setDistanceRef.current    = setDistance;
  setIsNewRecordRef.current = setIsNewRecord;
  submitRecordRef.current   = submitRecord;

  // HUD refs (avoid re-renders)
  const distanceTopRef   = useRef<HTMLSpanElement>(null);
  const dangerOverlayRef = useRef<HTMLDivElement>(null);

  // Speech bubble refs
  const speechBubbleRef      = useRef<HTMLDivElement>(null);
  const lastMilestoneRef     = useRef<number>(0);
  const speechTimeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Character head Y in canvas coords (for speech bubble positioning)
  // bodyTopY = GROUND_Y - bodyH*2 - neckLen - headR*2 - 20
  //          = 720 - 36 - 10 - 28 - 20 = 626
  // headY ≈ bodyTopY - 2 (neckBase offset) - neck length (~10px) = ~614
  // Add neck chain travel: approximately 614px from top of canvas
  // Speech bubble sits ~60px above headY center (headR=14 + bubble height margin)
  const CHAR_HEAD_CANVAS_Y = 614; // approximate head center Y in canvas coords
  const SPEECH_BUBBLE_OFFSET = 60; // px above head center
  const speechBubbleTopPx = CHAR_HEAD_CANVAS_Y - SPEECH_BUBBLE_OFFSET;

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CANVAS_WIDTH  * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width  = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    return ctx;
  }, []);

  const showSpeechBubble = useCallback((message: string) => {
    const bubble = speechBubbleRef.current;
    if (!bubble) return;

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    bubble.textContent = message;
    bubble.classList.remove('speech-fadeout');
    bubble.classList.add('speech-visible');

    speechTimeoutRef.current = setTimeout(() => {
      bubble.classList.add('speech-fadeout');
      speechTimeoutRef.current = setTimeout(() => {
        bubble.classList.remove('speech-visible', 'speech-fadeout');
      }, 600);
    }, 2000);
  }, []);

  const updateHUD = useCallback((
    distance: number,
    isDangerous: boolean,
  ) => {
    const distStr = Math.floor(distance).toString();
    if (distanceTopRef.current) {
      distanceTopRef.current.textContent = distStr;
    }

    if (dangerOverlayRef.current) {
      dangerOverlayRef.current.style.display = isDangerous ? 'block' : 'none';
    }

    // Speech bubble milestone check
    const milestone = Math.floor(distance / 10) * 10;
    if (milestone > 0 && milestone !== lastMilestoneRef.current) {
      lastMilestoneRef.current = milestone;
      const message = milestone <= 100
        ? SPEECH_MESSAGES[milestone]
        : SPEECH_POOL[Math.floor(Math.random() * SPEECH_POOL.length)];
      if (message) showSpeechBubble(message);
    }
  }, [showSpeechBubble]);

  useEffect(() => {
    const ctx = setupCanvas();
    if (!ctx) return;

    const physics    = physicsRef.current;
    const character  = characterRef.current;
    const background = backgroundRef.current;
    const input      = inputRef.current;

    physics.reset();
    background.reset();
    gameOverFiredRef.current = false;

    if (containerRef.current) {
      input.attach(containerRef.current, (state) => {
        directionRef.current = state.direction;
      });
    }

    const update = (deltaTime: number) => {
      const dir = directionRef.current;
      physics.update(deltaTime, dir);

      const state = physics.getState();

      background.update(deltaTime, state.speed, state.distance);

      character.update(
        CHARACTER_X,
        GROUND_Y,
        state.walkPhase,
        state.angle,
        deltaTime,
        state.isGameOver
      );

      updateHUD(
        state.distance,
        physics.isDangerous(),
      );

      if (state.isGameOver && !gameOverFiredRef.current) {
        gameOverFiredRef.current = true;
        // Commit final distance to store only once at game over
        setDistanceRef.current(state.distance);
        const isNew = submitRecordRef.current(state.distance);
        setIsNewRecordRef.current(isNew);
        // Let the fall-over animation play (550ms) then show the game over screen
        gameOverTimerRef.current = setTimeout(() => {
          gameLoopRef.current?.stop();
          setPhaseRef.current('over');
        }, 800);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      background.render(ctx);

      const state = physics.getState();
      character.render(
        ctx,
        CHARACTER_X,
        GROUND_Y,
        state.angle,
        state.walkPhase,
        state.isGameOver
      );
    };

    const loop = new GameLoop(update, render);
    gameLoopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      input.detach();
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupCanvas, updateHUD]);

  return (
    <div className="game-screen" ref={containerRef}>
      <canvas ref={canvasRef} className="game-canvas" />

      {/* HUD Top */}
      <div className="hud-top">
        <div className="hud-distance">
          <span className="distance-num" ref={distanceTopRef}>0</span>
          <span className="distance-unit">m</span>
        </div>
        <div className="hud-best">Best: {bestDistance}m</div>
      </div>

      {/* Speech bubble — positioned dynamically at character head */}
      <div
        className="speech-bubble"
        ref={speechBubbleRef}
        style={{
          top: `${speechBubbleTopPx}px`,
          left: `${CHARACTER_X}px`,
        }}
      />

      {/* Touch hints */}
      <div className="touch-hint touch-hint--left">
        <div className="touch-arrow-box">←</div>
        <span className="touch-label">LEFT</span>
      </div>
      <div className="touch-hint touch-hint--right">
        <div className="touch-arrow-box">→</div>
        <span className="touch-label">RIGHT</span>
      </div>

      {/* Danger overlay */}
      <div className="danger-overlay" ref={dangerOverlayRef} />
    </div>
  );
};
