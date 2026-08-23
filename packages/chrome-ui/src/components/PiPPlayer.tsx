import { useState, useRef } from "react";
import type { MediaStream } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly streams: readonly MediaStream[];
  readonly onClose: () => void;
}

export function PiPPlayer({ streams, onClose }: Props): JSX.Element {
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeStream = streams[selectedStreamIndex] ?? streams[0] ?? null;

  const togglePlay = (): void => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      void videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (s: number): void => {
    setSpeed(s);
    if (videoRef.current) {
      videoRef.current.playbackRate = s;
    }
  };

  const handleVolumeChange = (v: number): void => {
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
    }
  };

  const handlePlayNative = (): void => {
    if (activeStream && window.mine.playNativeMedia) {
      void window.mine.playNativeMedia({
        streamId: activeStream.id,
        url: activeStream.url,
        title: activeStream.title,
      });
    }
  };

  return (
    <div className="pip-overlay" onClick={onClose} data-testid="pip-overlay">
      <div className="pip-player-card" onClick={(e) => e.stopPropagation()} data-testid="pip-player-card">
        <header className="pip-player__header">
          <div className="pip-player__title-row">
            <span className="pip-player__icon">🎬</span>
            <span className="pip-player__title" title={activeStream?.title || activeStream?.url}>
              {activeStream?.title || activeStream?.url || "Media Player"}
            </span>
          </div>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        {/* Stream Selector Dropdown */}
        {streams.length > 1 ? (
          <div className="pip-player__stream-selector">
            <label htmlFor="pip-stream-select">Stream:</label>
            <select
              id="pip-stream-select"
              value={selectedStreamIndex}
              onChange={(e) => setSelectedStreamIndex(Number(e.target.value))}
              className="pip-stream-select"
            >
              {streams.map((s, idx) => (
                <option key={s.id} value={idx}>
                  {s.format.toUpperCase()} • {s.mimeType} {s.isDrmProtected ? "🔒 DRM" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* DRM Warning Badge if Protected */}
        {activeStream?.isDrmProtected ? (
          <div className="pip-player__drm-badge">
            <span>🔒 DRM Protected Stream</span>
            <p>This stream uses Widevine/DRM encryption and is played safely in browser view.</p>
          </div>
        ) : null}

        {/* Embedded HTML5 Video Element for direct/HLS previews */}
        {activeStream ? (
          <div className="pip-player__video-wrapper">
            <video
              ref={videoRef}
              src={activeStream.url}
              className="pip-player__video"
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                if (el.duration) {
                  setProgress((el.currentTime / el.duration) * 100);
                }
              }}
            />
          </div>
        ) : null}

        {/* Seek Bar */}
        <div className="pip-player__seek-bar">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => {
              const val = Number(e.target.value);
              setProgress(val);
              if (videoRef.current && videoRef.current.duration) {
                videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
              }
            }}
          />
        </div>

        {/* Player Controls */}
        <div className="pip-player__controls">
          <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={togglePlay}>
            {isPlaying ? "Ⅱ Pause" : "▶ Play"}
          </button>

          {/* Speed Selector */}
          <div className="pip-player__speed-bar">
            {[0.5, 1.0, 1.25, 1.5, 2.0].map((s) => (
              <button
                key={s}
                type="button"
                className={`pip-speed-btn ${speed === s ? "pip-speed-btn--active" : ""}`}
                onClick={() => handleSpeedChange(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          <div className="pip-player__volume-wrap">
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Native MPV Handoff Button */}
        {!activeStream?.isDrmProtected ? (
          <footer className="pip-player__footer">
            <button type="button" className="glass-btn glass-btn--sm" onClick={handlePlayNative}>
              ▶ Handoff to Native Player (MPV)
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
