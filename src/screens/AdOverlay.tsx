import React, { useEffect, useState } from 'react';
import './AdOverlay.css';

interface AdOverlayProps {
  type: 'interstitial' | 'rewarded';
  onComplete: (success: boolean) => void;
}

export const AdOverlay: React.FC<AdOverlayProps> = ({ type, onComplete }) => {
  const [countdown, setCountdown] = useState(type === 'interstitial' ? 3 : 5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (type === 'rewarded') {
            // Rewarded ad auto-completes
            onComplete(true);
          } else {
            setCanSkip(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [type, onComplete]);

  const handleSkip = () => {
    if (type === 'interstitial') {
      onComplete(true);
    }
  };

  const handleClose = () => {
    onComplete(false);
  };

  return (
    <div className="ad-overlay">
      <div className="ad-overlay__box">
        <div className="ad-overlay__label">
          {type === 'interstitial' ? '광고' : '리워드 광고'}
        </div>
        <div className="ad-overlay__placeholder">
          <div className="ad-overlay__icon">AD</div>
          <div className="ad-overlay__text">
            {type === 'interstitial'
              ? '광고 영역 (placeholder)'
              : '광고 시청 중... 이어하기 보상!'}
          </div>
        </div>
        <div className="ad-overlay__timer">
          {countdown > 0 ? `${countdown}초 남음` : '완료!'}
        </div>
        <div className="ad-overlay__actions">
          {type === 'interstitial' && canSkip && (
            <button className="ad-overlay__btn" onClick={handleSkip}>
              건너뛰기
            </button>
          )}
          {type === 'interstitial' && !canSkip && (
            <button className="ad-overlay__btn ad-overlay__btn--disabled" disabled>
              {countdown}초 후 건너뛰기
            </button>
          )}
          {type === 'rewarded' && countdown > 0 && (
            <button className="ad-overlay__btn ad-overlay__btn--close" onClick={handleClose}>
              포기하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
