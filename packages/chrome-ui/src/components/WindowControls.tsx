import type { JSX } from "react";

export function WindowControls({ maximized }: { maximized: boolean }): JSX.Element {
  return (
    <div className="wincontrols" data-testid="window-controls">
      <button
        type="button"
        className="glass-btn"
        aria-label="minimize window"
        title="Minimize"
        onClick={() => void window.mine.minimizeWindow()}
      >
        &#x2500;
      </button>
      <button
        type="button"
        className="glass-btn"
        aria-label={maximized ? "restore window" : "maximize window"}
        title={maximized ? "Restore" : "Maximize"}
        onClick={() => void window.mine.toggleMaximizeWindow()}
      >
        {maximized ? "\u2750" : "\u25A1"}
      </button>
      <button
        type="button"
        className="glass-btn wincontrols__close"
        aria-label="close window"
        title="Close"
        onClick={() => void window.mine.closeWindow()}
      >
        &#x2715;
      </button>
    </div>
  );
}
