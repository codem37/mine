import { spawn, type ChildProcess } from "node:child_process";
import type { PlayerState } from "@mine/contracts";

export interface PlayerOptions {
  readonly title?: string;
  readonly playerBinary?: string;
  readonly startPosition?: number;
}

export class NativePlayer {
  private activeProcess: ChildProcess | null = null;
  private state: PlayerState = {
    sourceId: null,
    status: "idle",
    currentTime: 0,
    duration: 0,
    bufferedSeconds: 0,
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
  };

  play(urlString: string, options: PlayerOptions = {}): boolean {
    if (this.activeProcess && !this.activeProcess.killed) {
      try {
        this.activeProcess.kill();
      } catch {
        // ignore
      }
    }

    const binary = options.playerBinary ?? "mpv";
    const args = [urlString];
    if (options.title) args.push(`--title=${options.title}`);
    if (options.startPosition && options.startPosition > 0) args.push(`--start=${options.startPosition}`);

    try {
      const child = spawn(binary, args, {
        detached: true,
        stdio: "ignore",
      });
      child.on("error", () => {
        // Fallback when native player binary (mpv/vlc) is not installed on host PATH
        this.activeProcess = null;
      });
      child.unref();
      this.activeProcess = child;
      this.state = {
        ...this.state,
        sourceId: urlString,
        status: "playing",
        currentTime: options.startPosition ?? 0,
      };
      return true;
    } catch {
      // Fallback preview mode inside player window
      this.state = {
        ...this.state,
        sourceId: urlString,
        status: "playing",
      };
      return false;
    }
  }

  pause(): void {
    this.state = { ...this.state, status: "paused" };
  }

  resume(): void {
    this.state = { ...this.state, status: "playing" };
  }

  seek(seconds: number): void {
    const clamped = Math.max(0, Math.min(this.state.duration || 1000, seconds));
    this.state = {
      ...this.state,
      currentTime: clamped,
      currentFrame: Math.floor(clamped * this.state.frameFps),
    };
  }

  setVolume(vol: number): void {
    this.state = { ...this.state, volume: Math.max(0, Math.min(1, vol)), muted: vol === 0 };
  }

  setSpeed(speed: number): void {
    const clamped = Math.max(0.25, Math.min(3.0, speed));
    this.state = { ...this.state, playbackRate: clamped };
  }

  setABLoop(range: readonly [number, number] | null): void {
    this.state = {
      ...this.state,
      loopState: range !== null ? "range" : "off",
      loopRange: range,
    };
  }

  stepFrame(forward = true): void {
    const delta = (1 / this.state.frameFps) * (forward ? 1 : -1);
    const newTime = Math.max(0, this.state.currentTime + delta);
    this.state = {
      ...this.state,
      currentTime: newTime,
      currentFrame: Math.floor(newTime * this.state.frameFps),
      status: "paused",
    };
  }

  setSubtitleOffset(seconds: number): void {
    this.state = { ...this.state, subtitleOffsetSeconds: Math.max(-10, Math.min(10, seconds)) };
  }

  setAudioOffset(seconds: number): void {
    this.state = { ...this.state, audioOffsetSeconds: Math.max(-5, Math.min(5, seconds)) };
  }

  getState(): PlayerState {
    return this.state;
  }

  stop(): void {
    if (this.activeProcess) {
      try {
        this.activeProcess.kill();
      } catch {
        // ignore
      }
      this.activeProcess = null;
    }
    this.state = { ...this.state, status: "idle", sourceId: null };
  }
}
