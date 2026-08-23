import { useEffect, useRef, useState, useCallback } from "react";
import type { JSX, ChangeEvent } from "react";
import type { EqualizerState, MediaSource, PlayerState, VideoTransform } from "@mine/contracts";

interface Props {
  readonly source: MediaSource;
  readonly onClose: () => void;
  readonly onOpenQueue?: () => void;
  readonly onOpenHistory?: () => void;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0];

const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock: [4, 3, 2, 0, -1, 1, 3, 4, 5, 5],
  Pop: [-1, 1, 3, 4, 3, 1, -1, -1, 1, 2],
  Jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
  Classical: [5, 4, 3, 2, -1, -1, 0, 2, 3, 4],
  Speech: [-2, -1, 0, 2, 4, 4, 3, 1, -1, -2],
};

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function CinematicPlayer({ source, onClose, onOpenQueue, onOpenHistory }: Props): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    sourceId: source.id,
    status: "playing",
    currentTime: 0,
    duration: source.durationSeconds ?? 120,
    bufferedSeconds: 30,
    volume: 1.0,
    volumeBoost: 1.0,
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
    videoTransform: { fit: "contain", rotation: 0, flipH: false, flipV: false },
    equalizer: { enabled: false, preset: "Flat", bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    activeTabMediaCount: 1,
    diagnostics: {
      decoder: "h264_nvdec (Hardware)",
      renderer: "gpu (Direct3D11)",
      droppedFrames: 0,
      renderedFrames: 1420,
      hwDecoding: true,
      audioVideoSyncMs: 0,
    },
  });

  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [showInfo, setShowInfo] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [customSubtitleUrl, setCustomSubtitleUrl] = useState<string | null>(null);
  const [downloadMsg, setDownloadMsg] = useState("");
  const [volumeBoostEnabled, setVolumeBoostEnabled] = useState(false);

  // Sync IPC state
  useEffect(() => {
    let active = true;
    if (window.mine.getMediaState) {
      void window.mine.getMediaState().then((res) => {
        if (active && res.ok && res.value) setPlayerState(res.value);
      });
    }
    const unbind = window.mine.onPlayerStateChanged?.((st) => {
      if (active) setPlayerState(st);
    });
    return () => {
      active = false;
      unbind?.();
    };
  }, []);

  const sendControl = useCallback((action: import("@mine/contracts").MediaControlRequest["action"], value?: unknown) => {
    void window.mine.controlMedia?.({ action, value });
  }, []);

  // Keyboard Shortcuts (Space, Arrows, M, F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        sendControl(playerState.status === "playing" ? "pause" : "play");
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        sendControl("seek", Math.max(0, playerState.currentTime - 5));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        sendControl("seek", playerState.currentTime + 5);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        sendControl("setVolume", Math.min(1.0, playerState.volume + 0.1));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        sendControl("setVolume", Math.max(0.0, playerState.volume - 0.1));
      } else if (e.code === "KeyM") {
        e.preventDefault();
        sendControl("setMute", !playerState.muted);
      } else if (e.code === "KeyF") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          void videoRef.current?.requestFullscreen();
        } else {
          void document.exitFullscreen();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerState, sendControl]);

  // Download Handoff to @mine/fetcher
  const handleDownload = (): void => {
    if (source.isDrmProtected) {
      setDownloadMsg("Protected media — direct download unavailable.");
      return;
    }
    setDownloadMsg("Sent to Download Manager…");
    void window.mine.downloadMediaSource({
      sourceId: source.id,
      url: source.url,
      title: source.title || "Media Stream",
      quality: selectedQuality,
      format: source.format,
    }).finally(() => {
      setTimeout(() => setDownloadMsg(""), 3000);
    });
  };

  // Video Frame Screenshot
  const handleTakeScreenshot = (): void => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${source.title || "video-frame"}-${Date.now()}.png`;
        a.click();
      }
    } catch {
      // ignore frame capture restriction
    }
  };

  // Load subtitle file
  const handleSubtitleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomSubtitleUrl(url);
    }
  };

  const transform = playerState.videoTransform;
  const transformStyle = {
    objectFit: transform.fit,
    transform: `rotate(${transform.rotation}deg) scaleX(${transform.flipH ? -1 : 1}) scaleY(${transform.flipV ? -1 : 1})`,
  };

  return (
    <div className="cinematic-player-overlay" data-testid="cinematic-player">
      <div className="cinematic-player-card">
        {/* Header toolbar */}
        <header className="cinematic-player__header">
          <span className="cinematic-player__title" title={source.title || "Media Player"}>
            {source.title || "Media Player"}
          </span>
          <div className="cinematic-player__header-actions">
            {onOpenQueue && (
              <button type="button" className="glass-btn glass-btn--sm" onClick={onOpenQueue} title="Queue">
                📋 Queue
              </button>
            )}
            {onOpenHistory && (
              <button type="button" className="glass-btn glass-btn--sm" onClick={onOpenHistory} title="History">
                📜 History
              </button>
            )}
            <button type="button" className="glass-btn glass-btn--sm" onClick={() => setShowInfo(!showInfo)} title="Media Info">
              ℹ Info
            </button>
            <button type="button" className="glass-btn glass-btn--sm" onClick={onClose} aria-label="Close Player">
              ✕
            </button>
          </div>
        </header>

        {/* Video viewport */}
        <div className="cinematic-player__viewport">
          <video
            ref={videoRef}
            src={source.url}
            className="cinematic-player__video"
            style={transformStyle}
            controls={false}
            autoPlay
            onClick={() => sendControl(playerState.status === "playing" ? "pause" : "play")}
          >
            {customSubtitleUrl && <track kind="subtitles" src={customSubtitleUrl} default label="Custom Subtitles" />}
          </video>
        </div>

        {/* Timeline slider */}
        <div className="cinematic-player__timeline-row">
          <span className="time-code">{formatTime(playerState.currentTime)}</span>
          <input
            type="range"
            className="cinematic-timeline"
            min={0}
            max={playerState.duration || 100}
            step={0.1}
            value={playerState.currentTime}
            onChange={(e) => sendControl("seek", parseFloat(e.target.value))}
            aria-label="Timeline seek"
          />
          <span className="time-code">{formatTime(playerState.duration)}</span>
        </div>

        {/* Physical VLC-inspired controls bar */}
        <div className="cinematic-player__controls">
          {/* Main playback buttons */}
          <div className="ctrl-group">
            <button type="button" className="glass-btn" title="Seek -5s" onClick={() => sendControl("seek", playerState.currentTime - 5)}>
              ⏮
            </button>
            <button
              type="button"
              className="glass-btn glass-btn--primary"
              title={playerState.status === "playing" ? "Pause (Space)" : "Play (Space)"}
              onClick={() => sendControl(playerState.status === "playing" ? "pause" : "play")}
            >
              {playerState.status === "playing" ? "⏸" : "▶"}
            </button>
            <button type="button" className="glass-btn" title="Seek +5s" onClick={() => sendControl("seek", playerState.currentTime + 5)}>
              ⏭
            </button>
            <button type="button" className="glass-btn" title="Stop" onClick={() => sendControl("pause", 0)}>
              ⏹
            </button>
          </div>

          {/* Volume + Software Boost */}
          <div className="ctrl-group volume-group">
            <button
              type="button"
              className="glass-btn glass-btn--sm"
              onClick={() => sendControl("setMute", !playerState.muted)}
              title={playerState.muted ? "Unmute" : "Mute"}
            >
              {playerState.muted || playerState.volume === 0 ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              className="volume-slider"
              min={0}
              max={1}
              step={0.05}
              value={playerState.muted ? 0 : playerState.volume}
              onChange={(e) => sendControl("setVolume", parseFloat(e.target.value))}
              aria-label="Volume"
            />
            <button
              type="button"
              className={`glass-btn glass-btn--sm ${volumeBoostEnabled ? "glass-btn--active" : ""}`}
              title="Software Volume Boost (100%–200%)"
              onClick={() => {
                const next = !volumeBoostEnabled;
                setVolumeBoostEnabled(next);
                sendControl("setVolumeBoost", next ? 1.5 : 1.0);
              }}
            >
              {volumeBoostEnabled ? "🔊 150%" : "100%"}
            </button>
          </div>

          {/* Speed Selector */}
          <div className="ctrl-group">
            <label className="ctrl-label">Speed:</label>
            <select
              className="glass-select"
              value={playerState.playbackRate}
              onChange={(e) => sendControl("setSpeed", parseFloat(e.target.value))}
              aria-label="Playback speed"
            >
              {PLAYBACK_SPEEDS.map((s) => (
                <option key={s} value={s}>{s}×</option>
              ))}
            </select>
          </div>

          {/* Advanced Toggles */}
          <div className="ctrl-group">
            <button type="button" className="glass-btn glass-btn--sm" onClick={() => setShowTransform(!showTransform)} title="Video Mode / Fit / Rotate">
              📐 Mode
            </button>
            <button type="button" className="glass-btn glass-btn--sm" onClick={() => setShowEq(!showEq)} title="Audio Equalizer">
              🎛 EQ
            </button>
            <label className="glass-btn glass-btn--sm file-upload-btn" title="Load Subtitles (.srt/.vtt)">
              💬 Subs
              <input type="file" accept=".vtt,.srt" onChange={handleSubtitleFileChange} style={{ display: "none" }} />
            </label>
            <button type="button" className="glass-btn glass-btn--sm" onClick={handleTakeScreenshot} title="Take Frame Screenshot">
              📸
            </button>
          </div>

          {/* Download & Fullscreen */}
          <div className="ctrl-group ctrl-group--end">
            <select
              className="glass-select"
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              aria-label="Quality selection"
            >
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>

            <button
              type="button"
              className="glass-btn glass-btn--primary"
              disabled={source.isDrmProtected}
              onClick={handleDownload}
              title={source.isDrmProtected ? "Protected media — download unavailable" : "Download to Fetcher"}
            >
              ↓ Download
            </button>

            <button
              type="button"
              className="glass-btn"
              title="Fullscreen (F)"
              onClick={() => void videoRef.current?.requestFullscreen()}
            >
              ⛶
            </button>
          </div>
        </div>

        {downloadMsg && <p className="download-status-bar">{downloadMsg}</p>}
        {volumeBoostEnabled && <p className="volume-boost-warning">⚠️ Software volume boost active — may cause audio clipping</p>}

        {/* Video Transform Panel */}
        {showTransform && (
          <div className="transform-panel">
            <span>Fit:</span>
            {(["contain", "cover", "fill", "original"] as const).map((fit) => (
              <button
                key={fit}
                type="button"
                className={`glass-btn glass-btn--sm ${transform.fit === fit ? "glass-btn--active" : ""}`}
                onClick={() => sendControl("setVideoTransform", { fit })}
              >
                {fit}
              </button>
            ))}
            <span className="sep">|</span>
            <span>Rotate:</span>
            {([0, 90, 180, 270] as const).map((rot) => (
              <button
                key={rot}
                type="button"
                className={`glass-btn glass-btn--sm ${transform.rotation === rot ? "glass-btn--active" : ""}`}
                onClick={() => sendControl("setVideoTransform", { rotation: rot })}
              >
                {rot}°
              </button>
            ))}
          </div>
        )}

        {/* Equalizer Modal */}
        {showEq && (
          <div className="eq-panel">
            <header className="eq-panel__header">
              <span>Software 10-Band Equalizer</span>
              <select
                className="glass-select"
                value={playerState.equalizer.preset}
                onChange={(e) => {
                  const p = e.target.value;
                  const bands = EQ_PRESETS[p] ?? EQ_PRESETS.Flat;
                  sendControl("setEqualizer", { enabled: true, preset: p, bands });
                }}
              >
                {Object.keys(EQ_PRESETS).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button type="button" className="glass-btn glass-btn--sm" onClick={() => setShowEq(false)}>✕</button>
            </header>
            <div className="eq-bands">
              {playerState.equalizer.bands.map((val, idx) => (
                <div key={idx} className="eq-band">
                  <input
                    type="range"
                    orient="vertical"
                    min={-6}
                    max={6}
                    value={val}
                    onChange={(e) => {
                      const nextBands = [...playerState.equalizer.bands];
                      nextBands[idx] = parseInt(e.target.value, 10);
                      sendControl("setEqualizer", { enabled: true, preset: "Custom", bands: nextBands });
                    }}
                  />
                  <span className="eq-band__label">{idx === 0 ? "60Hz" : idx === 4 ? "1kHz" : idx === 9 ? "15kHz" : `${idx + 1}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Info Modal */}
        {showInfo && (
          <div className="media-info-modal">
            <header className="media-info-modal__header">
              <h4>Media Information</h4>
              <button type="button" className="glass-btn glass-btn--sm" onClick={() => setShowInfo(false)}>✕</button>
            </header>
            <table className="media-info-table">
              <tbody>
                <tr><td>Title</td><td>{source.title || "—"}</td></tr>
                <tr><td>URL</td><td>{source.url}</td></tr>
                <tr><td>Format</td><td>{source.format.toUpperCase()}</td></tr>
                <tr><td>MIME Type</td><td>{source.mimeType}</td></tr>
                <tr><td>DRM Status</td><td>{source.isDrmProtected ? "Protected (Widevine/FairPlay)" : "None"}</td></tr>
                <tr><td>Decoder</td><td>{playerState.diagnostics.decoder}</td></tr>
                <tr><td>Renderer</td><td>{playerState.diagnostics.renderer}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
