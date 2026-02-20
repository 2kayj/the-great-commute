import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useRecordStore } from '../store/recordStore';
import './GameOverScreen.css';

export const GameOverScreen: React.FC = () => {
  const { distance, isNewRecord, setPhase } = useGameStore();
  const { bestDistance } = useRecordStore();

  const current = Math.floor(distance);
  const best    = bestDistance;
  const diff    = best - current;

  const handleRetry = () => {
    setPhase('countdown');
  };

  const handleHome = () => {
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

        {/* Coffee spill */}
        <div className="go-spill">
          <svg width="130" height="60" viewBox="0 0 130 60" fill="none">
            <path d="M 10 40 Q 20 25 40 30 Q 55 20 70 32 Q 85 22 100 30 Q 115 25 120 38 Q 110 50 90 48 Q 70 55 50 50 Q 30 55 15 48 Z"
                  fill="#8B5E3C" stroke="#5C3D1E" strokeWidth="2" opacity="0.85"/>
            <circle cx="25" cy="20" r="5" fill="#8B5E3C" stroke="#5C3D1E" strokeWidth="1.5" opacity="0.7"/>
            <circle cx="50" cy="12" r="4" fill="#8B5E3C" stroke="#5C3D1E" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="80" cy="10" r="6" fill="#8B5E3C" stroke="#5C3D1E" strokeWidth="1.5" opacity="0.7"/>
            <circle cx="108" cy="15" r="4" fill="#8B5E3C" stroke="#5C3D1E" strokeWidth="1.5" opacity="0.6"/>
          </svg>
        </div>

        {/* Fallen character */}
        <div className="go-fallen-char">
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            <line x1="80" y1="55" x2="60"  y2="20" stroke="#222" strokeWidth="3" strokeLinecap="round"/>
            <line x1="90" y1="55" x2="115" y2="40" stroke="#222" strokeWidth="3" strokeLinecap="round"/>
            <ellipse cx="85" cy="60" rx="22" ry="14" fill="white" stroke="#222" strokeWidth="2.5"
                     transform="rotate(-10, 85, 60)"/>
            <polygon points="80,52 84,62 76,62" fill="#333" stroke="#222" strokeWidth="1"
                     transform="rotate(-20, 80, 57)"/>
            <line x1="60" y1="58" x2="64" y2="52" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="52" cy="52" r="14" fill="white" stroke="#222" strokeWidth="2.5"/>
            {/* X eyes */}
            <line x1="44" y1="45" x2="50" y2="51" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
            <line x1="50" y1="45" x2="44" y2="51" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
            <line x1="55" y1="45" x2="61" y2="51" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
            <line x1="61" y1="45" x2="55" y2="51" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
            {/* Sad beak */}
            <path d="M 47 58 Q 52 64 57 58" stroke="#FFD700" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <line x1="72" y1="52" x2="48"  y2="32" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="98" y1="52" x2="128" y2="58" stroke="#222" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Dizzy */}
        <div className="go-dizzy">
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="25" r="18" stroke="#222" strokeWidth="2" strokeDasharray="4 4"/>
            <text x="25" y="31" textAnchor="middle" fontSize="16" fontFamily="serif" fill="#222">*</text>
          </svg>
        </div>

        {/* Aigo text */}
        <div className="aigo-text">아이고!</div>
      </div>

      {/* Bottom */}
      <div className="go-bottom">
        <div className="go-title">
          <div className="go-headline">출근에 실패했어요...</div>
          <div className="go-sub">다시 도전해봐요! 신입이 안오면 당신이 막내예요!</div>
        </div>

        <div className="result-box">
          <div className="result-item">
            <span className="result-label">이번 기록</span>
            <span className="result-value">
              {current}<span className="result-unit">m</span>
            </span>
            {isNewRecord && <div className="new-record">NEW RECORD!</div>}
          </div>
          <div className="result-item">
            <span className="result-label">최고 기록</span>
            <span className="result-value">
              {best}<span className="result-unit">m</span>
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
    </div>
  );
};
