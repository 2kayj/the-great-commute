import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useRecordStore } from '../store/recordStore';
import { useStageStore } from '../store/stageStore';
import { useItemStore } from '../store/itemStore';
import { GameLoop } from '../engine/GameLoop';
import { Physics } from '../engine/Physics';
import { EventManager } from '../engine/EventManager';
import { CharacterRenderer } from '../engine/CharacterRenderer';
import { BackgroundRenderer } from '../engine/BackgroundRenderer';
import { InputManager } from '../engine/InputManager';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CHARACTER_X, GROUND_Y } from '../utils/constants';
import { FollowerManager } from '../engine/followers/FollowerManager';
import { StageTransitionOverlay } from './StageTransitionOverlay';
import { PromotionScreen } from './PromotionScreen';
import { CutsceneScreen } from './CutsceneScreen';
import type { CutsceneType } from './CutsceneScreen';
import { getRankForDays, RANK_TABLE, TOTAL_STAGES, getCumulativeDistance } from '../data/rankTable';
import { getThemeForDays } from '../engine/themes';
import type { BackgroundTheme } from '../engine/themes';
import type { RankDef, EventType } from '../types/rank.types';
import './GameScreen.css';

type RankGroup =
  | 'company-junior'
  | 'company-manager'
  | 'company-exec'
  | 'politics-chaebol'
  | 'politics-politician'
  | 'isekai-beginner'
  | 'isekai-skilled'
  | 'isekai-boss'
  | 'space-rookie'
  | 'space-veteran';

function getRankGroup(rankId: string): RankGroup {
  switch (rankId) {
    // 회사 - 말단 (신입/대리/과장)
    case 'sinip': case 'daeri': case 'gwajang':
      return 'company-junior';
    // 회사 - 관리직 (팀장/부장)
    case 'timjang': case 'bujang':
      return 'company-manager';
    // 회사 - 임원 (상무)
    case 'sangmu':
      return 'company-exec';
    // 정치 - 재벌 (회장/총수)
    case 'hoejang': case 'chongsu':
      return 'politics-chaebol';
    // 정치 - 정치인 (국회의원/대통령)
    case 'gukhoe': case 'daetongryeong':
      return 'politics-politician';
    // 이세계 - 초보 (신입용사/기사)
    case 'yongsa': case 'gisa':
      return 'isekai-beginner';
    // 이세계 - 실력자 (마법사/현자/영웅)
    case 'mabeopsa': case 'hyeonja': case 'yeongung':
      return 'isekai-skilled';
    // 이세계 - 최강 (마왕/신)
    case 'mawang': case 'sin':
      return 'isekai-boss';
    // 우주 - 초보 (신입우주인/달탐험가)
    case 'ujuin': case 'dal':
      return 'space-rookie';
    // 우주 - 베테랑 (화성~천왕성)
    case 'hwaseong': case 'geumseong': case 'mokseong': case 'cheonwang':
      return 'space-veteran';
    default:
      return 'company-junior';
  }
}

// Keys are percentage milestones: 20, 40, 60, 80 (= 20%, 40%, 60%, 80% of stage distance)
// 100 is reserved for the stage-clear animation, so we only need up to 80.
const GROUP_SPEECHES: Record<RankGroup, Record<number, string>> = {
  // ===== 회사 - 말단 (신입/대리/과장) =====
  'company-junior': {
    20: '커피가 나보다 안정적이다',
    40: '오늘 점심 뭐 먹지',
    60: '월급날까지 며칠이지',
    80: '회사 보이려나',
  },
  // ===== 회사 - 관리직 (팀장/부장) =====
  'company-manager': {
    20: '커피가 두 잔째다',
    40: '넥타이가 비뚤어진 것 같다',
    60: '점심은 냉면으로',
    80: '회의실 자리 남았으려나',
  },
  // ===== 회사 - 임원 (상무) =====
  'company-exec': {
    20: '주가는 안 봤다',
    40: '오늘 일정이 뭐였더라',
    60: '점심은 누가 사주려나',
    80: '오늘 골프 약속이었나',
  },
  // ===== 정치 - 재벌 (회장/총수) =====
  'politics-chaebol': {
    20: '커피를 비서가 안 들었다',
    40: '바람이 양복을 스친다',
    60: '점심은 한정식으로',
    80: '운전기사 어디 간 거지',
  },
  // ===== 정치 - 정치인 (국회의원/대통령) =====
  'politics-politician': {
    20: '커피가 흔들린다 국정처럼',
    40: '연설문 외웠나 모르겠다',
    60: '점심은 국밥이 좋겠다',
    80: '카메라 없는 길이라 다행',
  },
  // ===== 이세계 - 초보 (신입용사/기사) =====
  'isekai-beginner': {
    20: '이 물약 떨어뜨리면 안 된다',
    40: '하늘이 두 개다',
    60: '나무가 말을 한 것 같은데',
    80: '슬라임이 지나갔다 아마',
  },
  // ===== 이세계 - 실력자 (마법사/현자/영웅) =====
  'isekai-skilled': {
    20: '물약이 흔들린다',
    40: '저 산 너머가 목적지겠지',
    60: '오늘은 바람마법 필요 없다',
    80: '파티원이 늦잠인가',
  },
  // ===== 이세계 - 최강 (마왕/신) =====
  'isekai-boss': {
    20: '부하가 만든 커피다',
    40: '{enemy}가 올 시간은 아니겠지',
    60: '하늘이 어둡다 원래 그렇다',
    80: '{building} 보이려나',
  },
  // ===== 우주 - 초보 (신입우주인/달탐험가) =====
  'space-rookie': {
    20: '이 커피 무중력에서 마시는 법',
    40: '별이 많다',
    60: '발밑이 좀 이상하다',
    80: '지구가 작게 보인다',
  },
  // ===== 우주 - 베테랑 (화성~천왕성) =====
  'space-veteran': {
    20: '이 행성 중력은 좀 다르다',
    40: '지평선이 휘어져 있다',
    60: '교신 상태 양호',
    80: '지구는 이제 점이다',
  },
};

// Rank-specific speech variable substitutions
const RANK_SPEECH_VARS: Record<string, Record<string, string>> = {
  mawang: { rankName: '마왕', building: '마왕성 첨탑이', enemy: '용사' },
  sin:    { rankName: '신', building: '신전이', enemy: '도전자' },
};

// Fallback: pick from the current group's speeches (not always company-junior)
function getSpeechFallback(group: RankGroup): string {
  const pool = Object.values(GROUP_SPEECHES[group]);
  return pool[Math.floor(Math.random() * pool.length)];
}

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

  const gameLoopRef        = useRef<GameLoop | null>(null);
  const physicsRef         = useRef<Physics>(new Physics());
  const eventManagerRef    = useRef<EventManager>(new EventManager());
  const characterRef       = useRef<CharacterRenderer>((() => {
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

  // Item store
  const { coffeeCount, consumeCoffee, addCoffee } = useItemStore();
  const coffeeCountRef    = useRef(coffeeCount);
  coffeeCountRef.current  = coffeeCount;
  const consumeCoffeeRef  = useRef(consumeCoffee);
  consumeCoffeeRef.current = consumeCoffee;

  // Stage store
  const { currentDay, stageBaseDistance, difficultyMultiplier, advanceStage, resetStage, totalCompletedDays, loopCount } = useStageStore();
  const stageBaseDistRef = useRef(stageBaseDistance);
  stageBaseDistRef.current = stageBaseDistance;
  // Derived from rankTable — target distance for the current stage
  const stageTargetDistRef = useRef(getRankForDays(totalCompletedDays).targetDistance);
  stageTargetDistRef.current = getRankForDays(totalCompletedDays).targetDistance;
  const currentDayRef = useRef(currentDay);
  currentDayRef.current = currentDay;
  const diffMultRef = useRef(difficultyMultiplier);
  diffMultRef.current = difficultyMultiplier;
  const advanceStageRef = useRef(advanceStage);
  advanceStageRef.current = advanceStage;

  // Active theme ref — used to avoid unnecessary setTheme calls
  const currentThemeRef = useRef<BackgroundTheme | null>(null);

  // Promotion state
  const pendingPromotionRankRef = useRef<RankDef | null>(null);

  // Cutscene state
  const pendingCutsceneTypeRef = useRef<CutsceneType | null>(null);

  // Stable refs for store actions
  const setPhaseRef       = useRef(setPhase);
  const setDistanceRef    = useRef(setDistance);
  const setIsNewRecordRef = useRef(setIsNewRecord);
  const submitRecordRef   = useRef(submitRecord);
  setPhaseRef.current       = setPhase;
  setDistanceRef.current    = setDistance;
  setIsNewRecordRef.current = setIsNewRecord;
  submitRecordRef.current   = submitRecord;

  // Coffee item refs
  const coffeeHudRef          = useRef<HTMLDivElement>(null);
  const coffeeShieldBarRef    = useRef<HTMLDivElement>(null);
  const coffeeShieldFillRef   = useRef<HTMLDivElement>(null);
  const coffeeEffectRef       = useRef<HTMLDivElement>(null);
  const coffeeEffectTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // HUD refs (avoid re-renders)
  const distanceTopRef   = useRef<HTMLSpanElement>(null);
  const dayLabelRef      = useRef<HTMLSpanElement>(null);
  const dangerOverlayRef = useRef<HTMLDivElement>(null);

  // Event indicator refs
  const windIndicatorRef  = useRef<HTMLDivElement>(null);
  const slopeIndicatorRef = useRef<HTMLDivElement>(null);
  const bumpIndicatorRef  = useRef<HTMLDivElement>(null);
  const bumpHideTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showCoffeeEffect = useCallback(() => {
    const el = coffeeEffectRef.current;
    if (!el) return;

    if (coffeeEffectTimerRef.current) clearTimeout(coffeeEffectTimerRef.current);

    el.classList.remove('coffee-effect-fadeout');
    el.classList.add('coffee-effect-visible');

    coffeeEffectTimerRef.current = setTimeout(() => {
      el.classList.add('coffee-effect-fadeout');
      coffeeEffectTimerRef.current = setTimeout(() => {
        el.classList.remove('coffee-effect-visible', 'coffee-effect-fadeout');
      }, 400);
    }, 800);
  }, []);

  const updateCoffeeHUD = useCallback((
    shieldActive: boolean,
    shieldRemaining: number,
    shieldTotal: number,
  ) => {
    if (coffeeHudRef.current) {
      coffeeHudRef.current.textContent = `☕ x${coffeeCountRef.current}`;
    }
    if (coffeeShieldBarRef.current) {
      coffeeShieldBarRef.current.style.display = shieldActive ? 'block' : 'none';
    }
    if (coffeeShieldFillRef.current && shieldActive) {
      const ratio = Math.max(0, shieldRemaining / shieldTotal);
      coffeeShieldFillRef.current.style.width = `${ratio * 100}%`;
    }
  }, []);

  const updateHUD = useCallback((
    distance: number,
    isDangerous: boolean,
    eventManager: EventManager,
  ) => {
    const distStr = Math.floor(distance).toString();
    if (distanceTopRef.current) {
      distanceTopRef.current.textContent = distStr;
    }

    if (dayLabelRef.current) {
      dayLabelRef.current.textContent = `Stage ${currentDayRef.current}`;
    }

    if (dangerOverlayRef.current) {
      dangerOverlayRef.current.style.display = isDangerous ? 'block' : 'none';
    }

    // Wind indicator
    if (windIndicatorRef.current) {
      if (eventManager.isWindActive()) {
        const dir = eventManager.getWindDirection();
        windIndicatorRef.current.textContent = dir > 0 ? '💨 바람 →' : '← 바람 💨';
        windIndicatorRef.current.style.display = 'flex';
      } else {
        windIndicatorRef.current.style.display = 'none';
      }
    }

    // Slope indicator
    if (slopeIndicatorRef.current) {
      if (eventManager.isSlopeActive()) {
        const dir = eventManager.getSlopeDirection();
        slopeIndicatorRef.current.textContent = dir > 0 ? '⛰️ 오르막 →' : '← 오르막 ⛰️';
        slopeIndicatorRef.current.style.display = 'flex';
      } else {
        slopeIndicatorRef.current.style.display = 'none';
      }
    }

    // Bump flash: show for 0.5s after last bump
    if (bumpIndicatorRef.current) {
      const elapsed = Date.now() - eventManager.getLastBumpTime();
      if (eventManager.getLastBumpTime() > 0 && elapsed < 500) {
        bumpIndicatorRef.current.style.display = 'flex';
      } else {
        bumpIndicatorRef.current.style.display = 'none';
      }
    }

    // Speech bubble milestone check (스테이지 진행률 % 기준: 20/40/60/80%)
    const stageDistance = distance - stageBaseDistRef.current;
    const targetDist = stageTargetDistRef.current;
    const progress = targetDist > 0 ? stageDistance / targetDist : 0;
    // Map progress to milestone bucket: 0%~20% → 0, 20%~40% → 20, 40%~60% → 40, ...
    const milestone = Math.floor(progress * 5) * 20;
    if (milestone > 0 && milestone <= 80 && milestone !== lastMilestoneRef.current) {
      lastMilestoneRef.current = milestone;
      const currentRank = getRankForDays(useStageStore.getState().totalCompletedDays);
      const group = getRankGroup(currentRank.id);
      const groupMessages = GROUP_SPEECHES[group];
      let message = groupMessages?.[milestone]
        ?? getSpeechFallback(group);
      // Replace rank-specific placeholders like {rankName}, {building}
      const vars = RANK_SPEECH_VARS[currentRank.id];
      if (vars && message) {
        message = message.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? _);
      }
      if (message) showSpeechBubble(message);
    }
  }, [showSpeechBubble]);

  useEffect(() => {
    const ctx = setupCanvas();
    if (!ctx) return;

    const physics         = physicsRef.current;
    const eventManager    = eventManagerRef.current;
    const character       = characterRef.current;
    const background      = backgroundRef.current;
    const followerManager = followerManagerRef.current;
    const input           = inputRef.current;

    background.reset();
    followerManager.reset();
    gameOverFiredRef.current = false;


    // Apply theme for the current stage
    const initialTheme = getThemeForDays(useStageStore.getState().totalCompletedDays);
    if (currentThemeRef.current !== initialTheme) {
      background.setTheme(initialTheme);
      currentThemeRef.current = initialTheme;
    }

    // Reset entering state
    enteringRef.current = { active: false, elapsed: 0, charX: CHARACTER_X, charOpacity: 1 };

    // Setup for current stage
    const stageState = useStageStore.getState();
    physics.setStageBaseDistance(stageState.stageBaseDistance);
    if (stageState.usedContinue && stageState.continueDistance > 0) {
      // Continue from the exact distance where the player died
      physics.resetForContinue(stageState.continueDistance, stageState.difficultyMultiplier);
    } else if (stageState.stageBaseDistance > 0) {
      // Resume from current Day's start point (fresh page load mid-run)
      physics.resetForContinue(stageState.stageBaseDistance, stageState.difficultyMultiplier);
    } else {
      // Day 1: reset everything
      physics.reset();
      physics.setStageMultiplier(stageState.difficultyMultiplier);
    }

    // Debug mode
    const debugParams = new URLSearchParams(window.location.search);
    const isDebug = debugParams.has('debug');
    if (isDebug) physics.setInvincible(true);

    // Debug: jump to specific stage via ?startDay=N (N = totalCompletedDays)
    const startDayParam = debugParams.get('startDay');
    if (startDayParam && !stageState.usedContinue) {
      const targetDays = parseInt(startDayParam, 10);
      if (targetDays > 0) {
        const jumpStageIndex = targetDays % TOTAL_STAGES;
        const baseDist = getCumulativeDistance(jumpStageIndex);
        const jumpRank = getRankForDays(targetDays);
        useStageStore.setState({
          totalCompletedDays: targetDays,
          currentDay: jumpStageIndex + 1,
          stageBaseDistance: baseDist,
          difficultyMultiplier: jumpRank.speedMultiplier,
        });
        // Sync refs immediately so game loop sees correct values
        stageBaseDistRef.current = baseDist;
        currentDayRef.current = jumpStageIndex + 1;
        diffMultRef.current = jumpRank.speedMultiplier;
        physics.reset();
        physics.resetForContinue(baseDist, jumpRank.speedMultiplier);
      }
    }

    // Re-read store after potential jump
    const effectiveState = useStageStore.getState();

    // Apply rank-based speed multiplier (scales with loop count too)
    const initialRankDef = getRankForDays(effectiveState.totalCompletedDays);
    const initialEffectiveSpeedMult = initialRankDef.speedMultiplier * (1 + effectiveState.loopCount * 0.1);
    physics.setSpeedMultiplier(initialEffectiveSpeedMult);
    const initialDampingPenalty = (initialRankDef.speedMultiplier - 1.0) * 0.045;
    physics.setRankDampingPenalty(initialDampingPenalty);

    // Apply held item and world hat for the current rank
    character.setItem(initialRankDef.item);
    character.setWorld(initialRankDef.world);
    character.setRankId(initialRankDef.id);

    // Setup EventManager for current rank progression (unlock all events for stages up to and including current)
    eventManager.reset();
    const unlockedEvents: EventType[] = [];
    for (const rank of RANK_TABLE) {
      if (rank.stageIndex > initialRankDef.stageIndex) break;
      if (rank.unlocksEvent) unlockedEvents.push(rank.unlocksEvent);
    }
    eventManager.setUnlockedEvents(unlockedEvents);
    eventManager.setIntensityMultiplier(Math.pow(1.5, effectiveState.loopCount));

    // Configure terrain segments for the current stage
    physics.setTerrainSegments(initialRankDef.segments);

    followerManager.setupForStage(effectiveState.stageBaseDistance, effectiveState.currentDay, effectiveState.totalCompletedDays);
    stageClearedRef.current = false;

    // 출근 시 커피 1잔 무료 지급
    useItemStore.getState().addCoffee(1);

    if (containerRef.current) {
      input.attach(containerRef.current, (state) => {
        directionRef.current = state.direction;
      });
    }

    const update = (deltaTime: number) => {
      // Skip physics during stage transition, promotion overlay, or cutscene
      const currentPhase = useGameStore.getState().phase;
      if (currentPhase === 'stage-transition' || currentPhase === 'promotion' || currentPhase === 'cutscene') {
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
        updateHUD(state.distance, false, eventManager);

        // Sequence complete: trigger stage-transition overlay
        if (progress >= 1) {
          entering.active = false;
          physics.setZeroGravity(false);
          background.hideGoalBuilding();

          // Check rank before advancing
          const prevStageState = useStageStore.getState();
          const rankBefore = getRankForDays(prevStageState.totalCompletedDays);

          advanceStageRef.current();

          const newStageState = useStageStore.getState();
          physics.setStageMultiplier(newStageState.difficultyMultiplier);
          physics.setStageBaseDistance(newStageState.stageBaseDistance);
          followerManager.setupForStage(newStageState.stageBaseDistance, newStageState.currentDay, newStageState.totalCompletedDays);

          // 다음 출근 시 커피 1잔 무료 지급
          useItemStore.getState().addCoffee(1);

          // Switch background theme if the world changed
          const newTheme = getThemeForDays(newStageState.totalCompletedDays);
          if (currentThemeRef.current !== newTheme) {
            background.setTheme(newTheme);
            currentThemeRef.current = newTheme;
          }

          // Check if rank changed
          const rankAfter = getRankForDays(newStageState.totalCompletedDays);
          character.setItem(rankAfter.item);
          character.setWorld(rankAfter.world);
          character.setRankId(rankAfter.id);

          // Configure terrain for the new stage
          physics.setTerrainSegments(rankAfter.segments);

          // Update rank-based speed multiplier and damping penalty after advancing
          const newEffectiveSpeedMult = rankAfter.speedMultiplier * (1 + newStageState.loopCount * 0.1);
          physics.setSpeedMultiplier(newEffectiveSpeedMult);
          const newDampingPenalty = (rankAfter.speedMultiplier - 1.0) * 0.045;
          physics.setRankDampingPenalty(newDampingPenalty);

          // Detect world transitions — these trigger a cutscene before promotion
          const crossedLoop = newStageState.totalCompletedDays % TOTAL_STAGES === 0;
          let cutsceneType: CutsceneType | null = null;

          if (crossedLoop) {
            cutsceneType = 'dream';
          } else if (rankBefore.world !== rankAfter.world) {
            if (rankAfter.world === 'isekai') cutsceneType = 'isekai';
            else if (rankAfter.world === 'space') cutsceneType = 'space';
          }

          if (cutsceneType !== null) {
            pendingCutsceneTypeRef.current = cutsceneType;
            // Store promotion rank so we can show it after cutscene (if applicable)
            if (rankAfter.id !== rankBefore.id && cutsceneType !== 'dream') {
              pendingPromotionRankRef.current = rankAfter;
            }
            setPhaseRef.current('cutscene');
          } else if (rankAfter.id !== rankBefore.id) {
            pendingPromotionRankRef.current = rankAfter;
            setPhaseRef.current('promotion');
          } else {
            setPhaseRef.current('stage-transition');
          }
        }
        return;
      }

      const dir = directionRef.current;

      // Inform EventManager of current terrain type (bumpy = short bumps, ice = no slope)
      eventManager.setTerrainState(physics.isBumpyTerrain(), physics.isIceTerrain());

      // Apply event modifiers before physics update
      const eventFrame = eventManager.update(deltaTime, physics.getState().distance);
      physics.setEventFrame(eventFrame);

      // Coffee auto-activation: 낙사 직전(54°) + 쉴드 미활성 + 커피 보유 시 자동 발동
      if (
        physics.isNearDeath() &&
        !physics.isCoffeeShieldActive() &&
        coffeeCountRef.current > 0
      ) {
        const consumed = consumeCoffeeRef.current();
        if (consumed) {
          physics.activateCoffeeShield(3);
          showCoffeeEffect();
          // 커피 HUD 즉시 갱신
          if (coffeeHudRef.current) {
            coffeeHudRef.current.textContent = `☕ x${useItemStore.getState().coffeeCount}`;
          }
        }
      }

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

      // Stage clear detection: use targetDistance from current rank config
      const currentRankConfig = getRankForDays(useStageStore.getState().totalCompletedDays);
      const nextStageDist = stageBaseDistRef.current + currentRankConfig.targetDistance;
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
        eventManager,
      );

      updateCoffeeHUD(
        physics.isCoffeeShieldActive(),
        physics.getCoffeeShieldRemaining(),
        3,
      );

      if (state.isGameOver && !gameOverFiredRef.current) {
        gameOverFiredRef.current = true;
        const stageState = useStageStore.getState();
        setDistanceRef.current(state.distance);
        const isNew = submitRecordRef.current(state.distance, stageState.currentDay, stageState.totalCompletedDays);
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
      if (bumpHideTimerRef.current) clearTimeout(bumpHideTimerRef.current);
      if (coffeeEffectTimerRef.current) clearTimeout(coffeeEffectTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupCanvas, updateHUD, updateCoffeeHUD, showCoffeeEffect]);

  const handleStageTransitionComplete = useCallback(() => {
    stageClearedRef.current = false;
    setPhase('playing');
  }, [setPhase]);

  const handlePromotionComplete = useCallback(() => {
    pendingPromotionRankRef.current = null;
    setPhase('stage-transition');
  }, [setPhase]);

  const handleCutsceneComplete = useCallback(() => {
    const cutsceneType = pendingCutsceneTypeRef.current;
    pendingCutsceneTypeRef.current = null;

    if (cutsceneType === 'dream') {
      // Loop reset: preserve totalCompletedDays / loopCount, restart from day 1
      resetStage();
      setPhase('ready');
    } else if (pendingPromotionRankRef.current) {
      // Show promotion screen after isekai/space cutscene
      setPhase('promotion');
    } else {
      setPhase('stage-transition');
    }
  }, [resetStage, setPhase]);

  const currentRank = getRankForDays(totalCompletedDays);
  const rankStars = loopCount > 0 ? '★'.repeat(loopCount) : '';

  return (
    <div className="game-screen" ref={containerRef}>
      <canvas ref={canvasRef} className="game-canvas" />

      {/* HUD Top */}
      <div className="hud-top">
        <div className="hud-distance">
          <span className="hud-day" ref={dayLabelRef}>Stage {currentDay}</span>
          <span className="hud-separator">|</span>
          <span className="distance-num" ref={distanceTopRef}>0</span>
          <span className="distance-unit">m</span>
        </div>
        <div className="hud-best">Best: {bestDistance}m</div>
      </div>

      {/* Rank badge */}
      <div className={`rank-badge rank-badge--${currentRank.world}`}>
        {rankStars}{currentRank.name}
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

      {/* Event indicators */}
      <div className="event-indicators">
        <div className="event-indicator event-indicator--wind" ref={windIndicatorRef} style={{ display: 'none' }} />
        <div className="event-indicator event-indicator--slope" ref={slopeIndicatorRef} style={{ display: 'none' }} />
        <div className="event-indicator event-indicator--bump" ref={bumpIndicatorRef} style={{ display: 'none' }}>💥 부딪힘!</div>
      </div>

      {/* Coffee HUD */}
      <div className="coffee-hud" ref={coffeeHudRef}>
        ☕ x{coffeeCount}
      </div>

      {/* Coffee effect overlay */}
      <div className="coffee-effect" ref={coffeeEffectRef}>
        ☕ 원샷!
      </div>

      {/* Coffee shield bar */}
      <div className="coffee-shield-bar" ref={coffeeShieldBarRef} style={{ display: 'none' }}>
        <div className="coffee-shield-label">카페인 효과가 발동중입니다</div>
        <div className="coffee-shield-bar__fill" ref={coffeeShieldFillRef} />
      </div>

      {/* Danger overlay */}
      <div className="danger-overlay" ref={dangerOverlayRef} />

      {/* Cutscene overlay */}
      {phase === 'cutscene' && pendingCutsceneTypeRef.current && (
        <CutsceneScreen
          type={pendingCutsceneTypeRef.current}
          loopCount={loopCount}
          onComplete={handleCutsceneComplete}
        />
      )}

      {/* Promotion screen */}
      {phase === 'promotion' && pendingPromotionRankRef.current && (
        <PromotionScreen
          rank={pendingPromotionRankRef.current}
          loopCount={loopCount}
          onComplete={handlePromotionComplete}
        />
      )}

      {/* Stage transition overlay */}
      {phase === 'stage-transition' && (
        <StageTransitionOverlay
          dayNumber={currentDay}
          totalCompletedDays={totalCompletedDays}
          loopCount={loopCount}
          onComplete={handleStageTransitionComplete}
        />
      )}
    </div>
  );
};
