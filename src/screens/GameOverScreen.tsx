import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useRecordStore } from '../store/recordStore';
import { useStageStore } from '../store/stageStore';
import { useAdStore } from '../store/adStore';
import { AdOverlay } from './AdOverlay';
import { getRankForDays } from '../data/rankTable';
import type { WorldPhase } from '../types/rank.types';
import platform from '../platform';
import './GameOverScreen.css';

const WORLD_GAMEOVER_MESSAGES: Record<WorldPhase, {
  fallen: string;
  headline: string;
  sub: string;
  compareLess: string;
  compareNew: string;
  compareSame: string;
}> = {
  company: {
    fallen: '...그냥 누울래요',
    headline: '출근 {day}에 실패했어요...',
    sub: '다시 도전해봐요! 지각보다는 낫잖아요... 아마도?',
    compareLess: '조금만 더 균형을 잡아보면 될 것 같은데...',
    compareNew: '더 멀리 갈 수 있을 것 같은데요?',
    compareSame: '어제의 나와 똑같이 싸웠네요. 오늘은 한 발 더!',
  },
  politics: {
    fallen: '...그냥 기권할래요',
    headline: '출정 {day}에 실패했어요...',
    sub: '다시 도전해봐요! 국민은 여러분의 재도전을 기다리고 있어요!',
    compareLess: '국민이 지켜보고 있어요! 조금만 더...',
    compareNew: '역대급 기록! 더 높이 올라갈 수 있어요!',
    compareSame: '현상 유지도 전략이지만, 더 높이 가봐요!',
  },
  isekai: {
    fallen: '...그냥 부활 포기할래요',
    headline: '모험 {day}에 쓰러졌어요...',
    sub: '다시 도전해봐요! 전설은 포기하지 않아요!',
    compareLess: '조금만 더 버티면 마왕성까지 갈 수 있을 텐데...',
    compareNew: '전설적인 기록! 더 먼 던전이 기다려요!',
    compareSame: '같은 던전에서 또 쓰러졌군요. 레벨업이 필요해요!',
  },
  space: {
    fallen: '...그냥 우주에 떠다닐래요',
    headline: '탐사 {day}에 실패했어요...',
    sub: '다시 도전해봐요! 우주는 도전하는 자의 것!',
    compareLess: '조금만 더 가면 새로운 행성에 도착할 텐데...',
    compareNew: '우주 신기록! 더 먼 은하가 기다려요!',
    compareSame: '같은 좌표에서 멈췄군요. 항로를 수정해봐요!',
  },
};

const DAY_LABELS: Record<number, string> = {
  1: '첫째날',
  2: '둘째날',
  3: '셋째날',
  4: '넷째날',
  5: '다섯째날',
  6: '여섯째날',
  7: '일곱째날',
};

function getDayLabel(day: number): string {
  return DAY_LABELS[day] ?? `${day}째날`;
}

export const GameOverScreen: React.FC = () => {
  const { distance, isNewRecord, setPhase } = useGameStore();
  const { bestDistance, bestDay, bestTotalDays } = useRecordStore();
  const { currentDay, usedContinue, continueFromCurrentDay, resetStage, totalCompletedDays, loopCount } = useStageStore();
  useAdStore();

  const currentRank = getRankForDays(totalCompletedDays);
  const bestRank = getRankForDays(bestTotalDays);
  const worldMsgs = WORLD_GAMEOVER_MESSAGES[currentRank.world as WorldPhase] ?? WORLD_GAMEOVER_MESSAGES.company;
  const loopStars = loopCount > 0 ? '★'.repeat(loopCount) + ' ' : '';
  const [showingRewardedAd, setShowingRewardedAd] = useState(false);
  const [showingInterstitialAd, setShowingInterstitialAd] = useState(false);

  const current = Math.floor(distance);
  const best    = bestDistance;
  const diff    = best - current;

  // 신기록 달성 시 토스 리더보드에 점수 제출 (fire-and-forget)
  useEffect(() => {
    if (isNewRecord && platform.PLATFORM === 'toss' && platform.submitScore) {
      platform.submitScore(Math.floor(bestDistance)).catch((e) => {
        console.warn('[gameover] 리더보드 점수 제출 실패:', e);
      });
    }
  }, [isNewRecord, bestDistance]);

  const handleOpenLeaderboard = () => {
    platform.openLeaderboard?.().catch((e) => {
      console.warn('[gameover] 리더보드 열기 실패:', e);
    });
  };

  const handleContinue = async () => {
    if (platform.PLATFORM === 'toss') {
      // 토스: 네이티브 SDK 광고 직접 호출
      const success = await platform.showRewardedAd();
      if (success) {
        continueFromCurrentDay(distance);
        setPhase('playing');
      }
    } else {
      // 데모/스토어: 기존 AdOverlay 사용
      setShowingRewardedAd(true);
    }
  };

  const handleRewardedAdComplete = (success: boolean) => {
    setShowingRewardedAd(false);
    if (success) {
      continueFromCurrentDay(distance);
      setPhase('playing');
    }
  };

  const handleRetry = async () => {
    if (platform.PLATFORM === 'toss') {
      // 3회 이상 플레이 시 전면 광고
      const adStore = useAdStore.getState();
      adStore.incrementPlayCount();
      if (adStore.shouldShowInterstitial()) {
        await platform.showInterstitialAd();
      }
    }
    resetStage();
    setPhase('countdown');
  };

  const handleInterstitialComplete = () => {
    setShowingInterstitialAd(false);
    setPhase('countdown');
  };

  const handleHome = () => {
    resetStage();
    setPhase('ready');
  };

  return (
    <div className="gameover-screen">
      {/* Scene top */}
      <div className="go-scene">
        {/* Background buildings */}
        <div className="go-buildings">
          <svg width="390" height="200" viewBox="0 0 390 200" fill="white">
            <rect x="0"   y="60" width="40" height="140" fill="white" stroke="#ddd" strokeWidth="1.5"/>
            <rect x="45"  y="20" width="55" height="180" fill="white" stroke="#ddd" strokeWidth="1.5"/>
            <rect x="105" y="45" width="42" height="155" fill="white" stroke="#ddd" strokeWidth="1.5"/>
            <rect x="152" y="10" width="60" height="190" fill="white" stroke="#ddd" strokeWidth="1.5"/>
            <rect x="217" y="35" width="45" height="165" fill="white" stroke="#ddd" strokeWidth="1.5"/>
            <rect x="267" y="25" width="55" height="175" fill="white" stroke="#ddd" strokeWidth="1.5"/>
            <rect x="327" y="55" width="38" height="145" fill="white" stroke="#ddd" strokeWidth="1.5"/>
            <rect x="370" y="15" width="20" height="185" fill="white" stroke="#ddd" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Ground */}
        <div className="go-ground" />

        {/* Fallen character */}
        <div className="go-fallen-char">
          <svg width="320" height="120" viewBox="0 0 320 120" fill="none">
            <g transform="rotate(90, 60, 110)">
              <path d="M 54 45 Q 46 65 54 110" stroke="#222" strokeWidth="3" strokeLinecap="round"/>
              <path d="M 66 45 Q 74 65 66 110" stroke="#222" strokeWidth="3" strokeLinecap="round"/>
              <ellipse cx="60" cy="34" rx="22" ry="18" fill="white" stroke="#222" strokeWidth="2.5"/>
              <polygon points="60,26 56,38 64,38" fill="#333" stroke="#222" strokeWidth="1"/>
              <path d="M 39 25 Q 31 43 38 63" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M 81 25 Q 89 43 82 63" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="60" y1="14" x2="60" y2="4" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="60" cy="-10" r="14" fill="white" stroke="#222" strokeWidth="2.5"/>
              <circle cx="55" cy="-13" r="2" fill="#222"/>
              <circle cx="65" cy="-13" r="2" fill="#222"/>
              <polygon points="60,-6 55,0 65,0" fill="#FFD700" stroke="#222" strokeWidth="1.5"/>
            </g>
          </svg>
        </div>

        <div className="aigo-text">{worldMsgs.fallen}</div>
      </div>

      {/* Bottom */}
      <div className="go-bottom">
        <div className="go-title">
          <div className="go-headline">{loopStars}{worldMsgs.headline.replace('{day}', getDayLabel(currentDay))}</div>
          <div className="go-sub">{worldMsgs.sub}</div>
        </div>

        <div className="result-box">
          <div className="result-item">
            <span className="result-label">도달</span>
            <span className="result-value">
              <span className="result-day">{loopStars}Day {currentDay} [{currentRank.name}]</span>
              <span className="result-distance">{current}<span className="result-unit">m</span></span>
            </span>
            {isNewRecord && <div className="new-record">NEW RECORD!</div>}
          </div>
          <div className="result-item">
            <span className="result-label">최고 기록</span>
            <span className="result-value">
              <span className="result-day">Day {bestDay || 1} [{bestRank.name}]</span>
              <span className="result-distance">{best}<span className="result-unit">m</span></span>
            </span>
          </div>
        </div>

        <div className="compare-box">
          {diff > 0 ? (
            <div className="compare-text">
              최고기록까지 <span className="highlight">{diff}m</span> 부족해요!
              <br />
              {worldMsgs.compareLess}
            </div>
          ) : isNewRecord ? (
            <div className="compare-text">
              신기록 달성! <span className="highlight">대단해요!</span>
              <br />
              {worldMsgs.compareNew}
            </div>
          ) : (
            <div className="compare-text">
              오늘은 최고 기록과 <span className="highlight">동일</span>해요!
              <br />
              {worldMsgs.compareSame}
            </div>
          )}
        </div>

        <div className="btn-group">
          {!usedContinue && currentDay > 1 && (
            <button className="btn-continue" onClick={handleContinue}>
              이어하기
            </button>
          )}
          <button className="btn-retry" onClick={handleRetry}>
            다시 도전하기!
          </button>
          <div className="btn-row">
            <button className="btn-secondary" onClick={handleHome}>
              홈으로
            </button>
            {platform.PLATFORM === 'toss' && (
              <button className="btn-secondary btn-leaderboard" onClick={handleOpenLeaderboard}>
                순위 보기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ad overlays */}
      {showingRewardedAd && (
        <AdOverlay type="rewarded" onComplete={handleRewardedAdComplete} />
      )}
      {showingInterstitialAd && (
        <AdOverlay type="interstitial" onComplete={handleInterstitialComplete} />
      )}
    </div>
  );
};
