import { useState, useEffect, useRef } from "react";
import type { MediaSource, PlayerState } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly source: MediaSource;
  readonly onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const mStr = m.toString().padStart(2, "0");
  const sStr = s.toString().padStart(2, "0");
  return `${mStr}:${sStr}`;
}

export function CinematicPlayer({ source, onClose }: Props): JSX.Element {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [playerState, setPlayerState] = useState<PlayerState>({
    sourceId: source.id,
    status: "playing",
    currentTime: source.playbackPosition ?? 0,
    duration: source.durationSeconds ?? 120,
    bufferedSeconds: 60,
    volume: 1.0,
    muted: false,
    playbackRate: 1.0,
    activeQuality: "Auto",
    activeAudioTrack: "audio-1",
    activeSubtitleTrack: null,
    subtitleOffsetSeconds: 0,
    audioOffsetSeconds: 0,
    loopState: "off",
    loopRange: null,
    currentFrame: 0,
    frameFps: 30,
    fullscreen: false,
    diagnostics: {
      decoder: "h264_nvdec (Hardware)",
      renderer: "gpu (Direct3D11)",
      droppedFrames: 0,
      renderedFrames: 1420,
      hwDecoding: true,
      audioVideoSyncMs: 0,
    },
  });

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(Boolean(source.playbackPosition && source.playbackPosition > 10));

  const inactivityTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-hide controls after 2 seconds of inactivity
  const handleMouseMove = (): void => {
    setControlsVisible(true);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      if (!showSpeedMenu && !showQualityMenu && !showSubMenu && !showAudioMenu && !showDiagnostics) {
        setControlsVisible(false);
      }
    }, 2000) as unknown as number;
  };

  useEffect(() => {
    let active = true;
    if (window.mine.onPlayerStateChanged) {
      const off = window.mine.onPlayerStateChanged((st) => {
        if (active) setPlayerState(st);
      });
      return () => {
        active = false;
        off();
      };
    }
    return () => {
      active = false;
    };
  }, []);

  const handleControl = (action: string, value?: unknown): void => {
    if (window.mine.controlMedia) {
      void window.mine.controlMedia({ action: action as any, value: value as any });
    }
  };

  const togglePlay = (): void => {
    if (playerState.status === "playing") {
      handleControl("pause");
      if (videoRef.current) videoRef.current.pause();
    } else {
      handleControl("play");
      if (videoRef.current) void videoRef.current.play();
    }
  };

  const handleSeek = (seconds: number): void => {
    handleControl("seek", seconds);
    if (videoRef.current) videoRef.current.currentTime = seconds;
  };

  const setABLoop = (): void => {
    if (!playerState.loopRange) {
      const a = Math.max(0, playerState.currentTime - 5);
      const b = Math.min(playerState.duration, playerState.currentTime + 10);
      handleControl("setABLoop", [a, b]);
    } else {
      handleControl("setABLoop", null);
    }
  };

  const handleDownload = (): void => {
    if (window.mine.downloadMediaSource) {
      void window.mine.downloadMediaSource({
        sourceId: source.id,
        url: source.url,
        title: source.title || "media-download",
        quality: playerState.activeQuality,
        format: source.format,
      });
    }
  };

  const progressPercent = playerState.duration > 0
    ? (playerState.currentTime / playerState.duration) * 100
    : 0;

  const bufferedPercent = playerState.duration > 0
    ? (playerState.bufferedSeconds / playerState.duration) * 100
    : 0;

  return (
    <div
      className="cinematic-player"
      onMouseMove={handleMouseMove}
      data-testid="cinematic-player"
    >
      {/* Resume Playback Prompt */}
      {showResumePrompt ? (
        <div className="cinematic-resume-toast" data-testid="resume-prompt">
          <span>Resume from {formatTime(source.playbackPosition!)}?</span>
          <div className="cinematic-resume__actions">
            <button
              type="button"
              className="glass-btn glass-btn--sm glass-btn--primary"
              onClick={() => {
                handleSeek(source.playbackPosition!);
                setShowResumePrompt(false);
              }}
            >
              Resume
            </button>
            <button
              type="button"
              className="glass-btn glass-btn--sm"
              onClick={() => {
                handleSeek(0);
                setShowResumePrompt(false);
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      ) : null}

      {/* Primary Video Surface */}
      <div className="cinematic-player__surface">
        <video
          ref={videoRef}
          src={source.url}
          className="cinematic-player__video"
          autoPlay
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) {
              setPlayerState((prev) => ({
                ...prev,
                currentTime: el.currentTime,
                duration: el.duration,
                currentFrame: Math.floor(el.currentTime * prev.frameFps),
              }));
            }
          }}
        />
      </div>

      {/* Floating Header */}
      <header className={`cinematic-player__header ${controlsVisible ? "cinematic-player__header--visible" : ""}`}>
        <div className="cinematic-player__title-group">
          <span className="cinematic-player__badge">{source.format.toUpperCase()}</span>
          <span className="cinematic-player__title">{source.title || source.url}</span>
        </div>
        <div className="cinematic-player__header-actions">
          <button
            type="button"
            className="glass-btn glass-btn--sm"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            title="Diagnostics"
          >
            ⚙ Diagnostics
          </button>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>
            ✕
          </button>
        </div>
      </header>

      {/* Diagnostics Panel Overlay */}
      {showDiagnostics ? (
        <div className="cinematic-diagnostics" data-testid="diagnostics-panel">
          <h4>Playback Diagnostics</h4>
          <div>Decoder: {playerState.diagnostics.decoder}</div>
          <div>Renderer: {playerState.diagnostics.renderer}</div>
          <div>Dropped Frames: {playerState.diagnostics.droppedFrames}</div>
          <div>Hardware Decoding: {playerState.diagnostics.hwDecoding ? "Enabled ✓" : "Disabled"}</div>
          <div>Audio/Video Sync: {playerState.diagnostics.audioVideoSyncMs} ms</div>
        </div>
      ) : null}

      {/* Floating Bottom Control Bar */}
      <footer className={`cinematic-player__footer ${controlsVisible ? "cinematic-player__footer--visible" : ""}`}>
        {/* Glass Slim Timeline */}
        <div className="cinematic-timeline-wrap">
          <div className="cinematic-timeline__track">
            <div className="cinematic-timeline__buffered" style={{ width: `${bufferedPercent}%` }} />
            <div className="cinematic-timeline__progress" style={{ width: `${progressPercent}%` }} />

            {/* A-B Loop Range Markers */}
            {playerState.loopRange ? (
              <div
                className="cinematic-timeline__loop-marker"
                style={{
                  left: `${(playerState.loopRange[0] / playerState.duration) * 100}%`,
                  width: `${((playerState.loopRange[1] - playerState.loopRange[0]) / playerState.duration) * 100}%`,
                }}
              />
            ) : null}
          </div>

          <input
            type="range"
            min="0"
            max={playerState.duration || 100}
            value={playerState.currentTime}
            className="cinematic-timeline__input"
            onChange={(e) => handleSeek(Number(e.target.value))}
          />
        </div>

        {/* Control Buttons Bar */}
        <div className="cinematic-controls">
          <div className="cinematic-controls__left">
            <button type="button" className="glass-btn glass-btn--primary" onClick={togglePlay}>
              {playerState.status === "playing" ? "Ⅱ" : "▶"}
            </button>

            {/* Step Frames Controls */}
            <button
              type="button"
              className="glass-btn glass-btn--sm"
              title="Previous Frame (,)"
              onClick={() => handleControl("stepFrame", false)}
            >
              |◀
            </button>
            <button
              type="button"
              className="glass-btn glass-btn--sm"
              title="Next Frame (.)"
              onClick={() => handleControl("stepFrame", true)}
            >
              ▶|
            </button>

            {/* Time / Frame Counter */}
            <span className="cinematic-time">
              {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
              {source.isLive ? <span className="cinematic-live-badge">● LIVE</span> : null}
            </span>
          </div>

          <div className="cinematic-controls__right">
            {/* A-B Loop Toggle */}
            <button
              type="button"
              className={`glass-btn glass-btn--sm ${playerState.loopState === "range" ? "glass-btn--primary" : ""}`}
              title="A-B Loop"
              onClick={setABLoop}
            >
              A-B Loop {playerState.loopState === "range" ? "✓" : ""}
            </button>

            {/* Speed Selector */}
            <div className="cinematic-popover-wrap">
              <button
                type="button"
                className="glass-btn glass-btn--sm"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              >
                {playerState.playbackRate}x
              </button>
              {showSpeedMenu ? (
                <div className="cinematic-popover">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`cinematic-popover__item ${playerState.playbackRate === s ? "cinematic-popover__item--active" : ""}`}
                      onClick={() => {
                        handleControl("setSpeed", s);
                        setShowSpeedMenu(false);
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Quality Selector */}
            <div className="cinematic-popover-wrap">
              <button
                type="button"
                className="glass-btn glass-btn--sm"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
              >
                {playerState.activeQuality}
              </button>
              {showQualityMenu ? (
                <div className="cinematic-popover">
                  {source.qualities.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      className={`cinematic-popover__item ${playerState.activeQuality === q.label ? "cinematic-popover__item--active" : ""}`}
                      onClick={() => {
                        handleControl("setQuality", q.label);
                        setShowQualityMenu(false);
                      }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Download Handoff to Fetcher */}
            <button
              type="button"
              className="glass-btn glass-btn--sm"
              title="Download via Fetcher"
              onClick={handleDownload}
            >
              ↓ Download
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
