import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Volume1, Volume } from 'lucide-react';
import { VolumeControlContainer, VolumeButton, VolumeSlider, VolumeSliderContainer } from './styles';

interface VideoVolumeControlProps {
  videoElement?: HTMLVideoElement | null;
  className?: string;
}

export const VideoVolumeControl: React.FC<VideoVolumeControlProps> = ({ videoElement, className }) => {
  const [volume, setVolume] = useState(0.1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // 비디오 엘리먼트가 변경될 때 초기 볼륨 설정
  useEffect(() => {
    if (videoElement) {
      setVolume(videoElement.volume);
      setIsMuted(videoElement.muted);
    }
  }, [videoElement]);

  // 볼륨 변경 처리
  const handleVolumeChange = (newVolume: number) => {
    if (!videoElement) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    videoElement.volume = clampedVolume;

    // 볼륨이 0이면 음소거 해제
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
      videoElement.muted = false;
    }
  };

  // 음소거 토글 처리
  const handleMuteToggle = () => {
    if (!videoElement) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    videoElement.muted = newMutedState;
  };

  // 볼륨 증가
  const handleVolumeUp = () => {
    handleVolumeChange(volume + 0.1);
  };

  // 볼륨 감소
  const handleVolumeDown = () => {
    handleVolumeChange(volume - 0.1);
  };

  // 볼륨 아이콘 결정
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX size={20} />;
    } else if (volume < 0.3) {
      return <Volume size={20} />;
    } else if (volume < 0.7) {
      return <Volume1 size={20} />;
    } else {
      return <Volume2 size={20} />;
    }
  };

  // 슬라이더 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sliderRef.current && !sliderRef.current.contains(event.target as Node)) {
        setShowSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <VolumeControlContainer className={className}>
      {/* 볼륨 감소 버튼 */}
      <VolumeButton onClick={handleVolumeDown} title="볼륨 감소" disabled={volume <= 0}>
        <Volume size={16} />
      </VolumeButton>

      {/* 음소거/볼륨 토글 버튼 */}
      <VolumeButton
        onClick={handleMuteToggle}
        title={isMuted ? '음소거 해제' : '음소거'}
        onMouseEnter={() => setShowSlider(true)}
        onMouseLeave={() => setShowSlider(false)}
      >
        {getVolumeIcon()}
      </VolumeButton>

      {/* 볼륨 증가 버튼 */}
      <VolumeButton onClick={handleVolumeUp} title="볼륨 증가" disabled={volume >= 1}>
        <Volume2 size={16} />
      </VolumeButton>

      {/* 볼륨 슬라이더 */}
      {showSlider && (
        <VolumeSliderContainer ref={sliderRef}>
          <VolumeSlider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVolumeChange(parseFloat(e.target.value))}
            title={`볼륨: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </VolumeSliderContainer>
      )}
    </VolumeControlContainer>
  );
};

export default VideoVolumeControl;
