import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useRecordStore } from '../store/recordStore';
import { useStageStore } from '../store/stageStore';
import { useAdStore } from '../store/adStore';
import { AdOverlay } from './AdOverlay';
import './GameOverScreen.css';

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
  const { bestDistance, bestDay } = useRecordStore();
  const { currentDay, usedContinue, continueFromCurrentDay, resetStage } = useStageStore();
  const { incrementPlayCount, shouldShowInterstitial } = useAdStore();
  const [showingRewardedAd, setShowingRewardedAd] = useState(false);
  const [showingInterstitialAd, setShowingInterstitialAd] = useState(false);

  const current = Math.floor(distance);
  const best    = bestDistance;
  const diff    = best - current;

  const handleContinue = () => {
    setShowingRewardedAd(true);
  };

  const handleRewardedAdComplete = (success: boolean) => {
    setShowingRewardedAd(false);
    if (success) {
      continueFromCurrentDay();
      setPhase('playing');
    }
  };

  const handleRetry = () => {
    resetStage();
    incrementPlayCount();
    if (shouldShowInterstitial()) {
      setShowingInterstitialAd(true);
    } else {
      setPhase('countdown');
    }
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

        <div className="aigo-text">...그냥 누울래요</div>
      </div>

      {/* Bottom */}
      <div className="go-bottom">
        <div className="go-title">
          <div className="go-headline">출근 {getDayLabel(currentDay)}에 실패했어요...</div>
          <div className="go-sub">다시 도전해봐요! 신입이 안오면 당신이 막내예요!</div>
        </div>

        <div className="result-box">
          <div className="result-item">
            <span className="result-label">도달</span>
            <span className="result-value">
              <span className="result-day">Day {currentDay}</span>
              <span className="result-distance">{current}<span className="result-unit">m</span></span>
            </span>
            {isNewRecord && <div className="new-record">NEW RECORD!</div>}
          </div>
          <div className="result-item">
            <span className="result-label">최고 기록</span>
            <span className="result-value">
              <span className="result-day">Day {bestDay || 1}</span>
              <span className="result-distance">{best}<span className="result-unit">m</span></span>
            </span>
          </div>
        </div>

        <div className="compare-box">
          {diff > 0 ? (
            <div className="compare-text">
              최고기록까지 <span className="highlight">{diff}m</span> 부족해요!
              <br />
              조금만 더 균형을 잡아보면 될 것 같은데...
            </div>
          ) : isNewRecord ? (
            <div className="compare-text">
              신기록 달성! <span className="highlight">대단해요!</span>
              <br />
              더 멀리 갈 수 있을 것 같은데요?
            </div>
          ) : (
            <div className="compare-text">
              오늘은 최고 기록과 <span className="highlight">동일</span>해요!
              <br />
              포기하지 말고 다시 도전!
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
