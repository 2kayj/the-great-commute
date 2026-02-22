import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useRecordStore } from '../store/recordStore';
import { useStageStore } from '../store/stageStore';
import { GameLoop } from '../engine/GameLoop';
import { Physics } from '../engine/Physics';
import { CharacterRenderer } from '../engine/CharacterRenderer';
import { BackgroundRenderer } from '../engine/BackgroundRenderer';
import { InputManager } from '../engine/InputManager';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CHARACTER_X, GROUND_Y } from '../utils/constants';
import { FollowerManager } from '../engine/followers/FollowerManager';
import { StageTransitionOverlay } from './StageTransitionOverlay';
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
  120: '비가 올 것 같은데...',
};
const SPEECH_POOL = Object.values(SPEECH_MESSAGES);

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

interface EnteringState {
  active: boolean;
  elapsed: number;
  charX: number;
  charOpacity: number;
}

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
  const followerManagerRef = useRef<FollowerManager>(new FollowerManager());
  const inputRef          = useRef<InputManager>(new InputManager());
  const directionRef      = useRef<-1 | 0 | 1>(0);
  const gameOverFiredRef  = useRef<boolean>(false);
  const gameOverTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageClearedRef   = useRef<boolean>(false);
  const enteringRef       = useRef<EnteringState>({
    active: false,
    elapsed: 0,
    charX: CHARACTER_X,
    charOpacity: 1,
  });

  const { phase, setPhase, setDistance, setIsNewRecord } = useGameStore();
  const { bestDistance, submitRecord } = useRecordStore();
  const bestDistRef = useRef(bestDistance);
  bestDistRef.current = bestDistance;

  // Stage store
  const { currentDay, stageBaseDistance, difficultyMultiplier, advanceStage } = useStageStore();
  const stageBaseDistRef = useRef(stageBaseDistance);
  stageBaseDistRef.current = stageBaseDistance;
  const currentDayRef = useRef(currentDay);
  currentDayRef.current = currentDay;
  const diffMultRef = useRef(difficultyMultiplier);
  diffMultRef.current = difficultyMultiplier;
  const advanceStageRef = useRef(advanceStage);
  advanceStageRef.current = advanceStage;

  // Stable refs for store actions
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
  const dayLabelRef      = useRef<HTMLSpanElement>(null);
  const dangerOverlayRef = useRef<HTMLDivElement>(null);

  // Speech bubble refs
  const speechBubbleRef      = useRef<HTMLDivElement>(null);
  const lastMilestoneRef     = useRef<number>(0);
  const speechTimeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CHAR_HEAD_CANVAS_Y = 614;
  const SPEECH_BUBBLE_OFFSET = 60;
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

    if (dayLabelRef.current) {
      dayLabelRef.current.textContent = `Day ${currentDayRef.current}`;
    }

    if (dangerOverlayRef.current) {
      dangerOverlayRef.current.style.display = isDangerous ? 'block' : 'none';
    }

    // Speech bubble milestone check
    const milestone = Math.floor(distance / 10) * 10;
    if (milestone > 0 && milestone !== lastMilestoneRef.current) {
      lastMilestoneRef.current = milestone;
      const message = SPEECH_MESSAGES[milestone]
        ?? SPEECH_POOL[Math.floor(Math.random() * SPEECH_POOL.length)];
      if (message) showSpeechBubble(message);
    }
  }, [showSpeechBubble]);

  useEffect(() => {
    const ctx = setupCanvas();
    if (!ctx) return;

    const physics         = physicsRef.current;
    const character       = characterRef.current;
    const background      = backgroundRef.current;
    const followerManager = followerManagerRef.current;
    const input           = inputRef.current;

    background.reset();
    followerManager.reset();
    gameOverFiredRef.current = false;

    // Reset entering state
    enteringRef.current = { active: false, elapsed: 0, charX: CHARACTER_X, charOpacity: 1 };

    // Setup for current stage
    const stageState = useStageStore.getState();
    if (stageState.usedContinue && stageState.stageBaseDistance > 0) {
      // Continue: resume from current Day's start point
      physics.resetForContinue(stageState.stageBaseDistance, stageState.difficultyMultiplier);
    } else {
      // Fresh start: reset everything
      physics.reset();
      physics.setStageMultiplier(stageState.difficultyMultiplier);
    }
    followerManager.setupForStage(stageState.stageBaseDistance, stageState.currentDay);
    stageClearedRef.current = false;

    if (containerRef.current) {
      input.attach(containerRef.current, (state) => {
        directionRef.current = state.direction;
      });
    }

    const update = (deltaTime: number) => {
      // Skip physics during stage transition (overlay is shown on top)
      const currentPhase = useGameStore.getState().phase;
      if (currentPhase === 'stage-transition') {
        return;
      }

      // ----- Entering-building animation -----
      const entering = enteringRef.current;
      if (entering.active) {
        entering.elapsed += deltaTime;

        const DURATION = 2.0;
        const progress = Math.min(entering.elapsed / DURATION, 1);

        // Background scrolls to a stop (lerps from full speed to 0 over duration)
        const state = physics.getState();
        const scrollSpeed = state.speed * (1 - progress);
        background.update(deltaTime, scrollSpeed, state.distance);

        // Goal building slides in during the first half (0→1 of the first second)
        background.setEnteringProgress(Math.min(progress * 2, 1));

        // Character walks toward the door from 40% progress onward
        const doorX = background.getGoalBuildingDoorX();
        if (progress > 0.4) {
          const moveProgress = (progress - 0.4) / 0.6;
          entering.charX = CHARACTER_X + (doorX - CHARACTER_X) * easeInOut(moveProgress);
        }

        // Fade out character after 80% progress
        if (progress > 0.8) {
          entering.charOpacity = 1 - (progress - 0.8) / 0.2;
        } else {
          entering.charOpacity = 1;
        }

        // Physics keeps running in zero-gravity mode (walkPhase advances)
        physics.update(deltaTime, 0);

        // Character stays at CHARACTER_X for physics (Verlet chains stay stable)
        // Visual offset is applied in render via canvas translate
        character.update(
          CHARACTER_X,
          GROUND_Y,
          state.walkPhase,
          state.angle,
          deltaTime,
          false,
          scrollSpeed > 10 ? state.speed : 40
        );

        // Follower stays put (no update call)

        // HUD still shows distance
        updateHUD(state.distance, false);

        // Sequence complete: trigger stage-transition overlay
        if (progress >= 1) {
          entering.active = false;
          physics.setZeroGravity(false);
          background.hideGoalBuilding();
          advanceStageRef.current();
          const newStageState = useStageStore.getState();
          physics.setStageMultiplier(newStageState.difficultyMultiplier);
          followerManager.setupForStage(newStageState.stageBaseDistance, newStageState.currentDay);
          setPhaseRef.current('stage-transition');
        }
        return;
      }

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
        state.isGameOver,
        state.speed
      );

      followerManager.update(deltaTime, state);

      // Stage clear detection: 400m per stage
      const nextStageDist = stageBaseDistRef.current + 400;
      if (state.distance >= nextStageDist && !stageClearedRef.current && !state.isGameOver) {
        stageClearedRef.current = true;
        // Start entering-building animation instead of jumping straight to transition
        enteringRef.current = {
          active: true,
          elapsed: 0,
          charX: CHARACTER_X,
          charOpacity: 1,
        };
        physics.setZeroGravity(true);
        background.showGoalBuilding();
        return;
      }

      updateHUD(
        state.distance,
        physics.isDangerous(),
      );

      if (state.isGameOver && !gameOverFiredRef.current) {
        gameOverFiredRef.current = true;
        const stageState = useStageStore.getState();
        setDistanceRef.current(state.distance);
        const isNew = submitRecordRef.current(state.distance, stageState.currentDay);
        setIsNewRecordRef.current(isNew);
        gameOverTimerRef.current = setTimeout(() => {
          gameLoopRef.current?.stop();
          setPhaseRef.current('over');
        }, 800);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      background.render(ctx);

      followerManager.render(ctx, GROUND_Y);

      const state = physics.getState();
      const entering = enteringRef.current;

      if (entering.active) {
        // Render at CHARACTER_X but visually offset via canvas translate
        // This keeps Verlet chains stable while character appears to move
        const offsetX = entering.charX - CHARACTER_X;
        ctx.save();
        ctx.globalAlpha = Math.max(0, entering.charOpacity);
        ctx.translate(offsetX, 0);
        character.render(
          ctx,
          CHARACTER_X,
          GROUND_Y,
          state.angle,
          state.walkPhase,
          false
        );
        ctx.restore();
      } else {
        character.render(
          ctx,
          CHARACTER_X,
          GROUND_Y,
          state.angle,
          state.walkPhase,
          state.isGameOver
        );
      }
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

  const handleStageTransitionComplete = useCallback(() => {
    stageClearedRef.current = false;
    setPhase('playing');
  }, [setPhase]);

  return (
    <div className="game-screen" ref={containerRef}>
      <canvas ref={canvasRef} className="game-canvas" />

      {/* HUD Top */}
      <div className="hud-top">
        <div className="hud-distance">
          <span className="hud-day" ref={dayLabelRef}>Day {currentDay}</span>
          <span className="hud-separator">|</span>
          <span className="distance-num" ref={distanceTopRef}>0</span>
          <span className="distance-unit">m</span>
        </div>
        <div className="hud-best">Best: {bestDistance}m</div>
      </div>

      {/* Speech bubble */}
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

      {/* Stage transition overlay */}
      {phase === 'stage-transition' && (
        <StageTransitionOverlay
          dayNumber={currentDay}
          onComplete={handleStageTransitionComplete}
        />
      )}
    </div>
  );
};
