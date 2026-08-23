import { spawn, type ChildProcess } from "node:child_process";

export interface PlayerOptions {
  readonly title?: string;
  readonly playerBinary?: string;
}

export class NativePlayer {
  private activeProcess: ChildProcess | null = null;

  play(urlString: string, options: PlayerOptions = {}): boolean {
    if (this.activeProcess && !this.activeProcess.killed) {
      try {
        this.activeProcess.kill();
      } catch {
        // ignore kill error
      }
    }

    const binary = options.playerBinary ?? "mpv";
    const args = [urlString];
    if (options.title) {
      args.push(`--title=${options.title}`);
    }

    try {
      const child = spawn(binary, args, {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      this.activeProcess = child;
      return true;
    } catch {
      // Fallback if mpv not found
      return false;
    }
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
  }
}
