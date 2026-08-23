import type { JSX } from "react";

export function WindowControls({ maximized }: { maximized: boolean }): JSX.Element {
  return (
    <div className="wincontrols" data-testid="window-controls">
      <button
        className="orb"
        aria-label="minimize window"
        onClick={() => void window.mine.minimizeWindow()}
      >
        &#x2500;
      </button>
      <button
        className="orb"
        aria-label={maximized ? "restore window" : "maximize window"}
        onClick={() => void window.mine.toggleMaximizeWindow()}
      >
        {maximized ? "\u2750" : "\u25A1"}
      </button>
      <button
        className="orb wincontrols__close"
        aria-label="close window"
        onClick={() => void window.mine.closeWindow()}
      >
        &#x2715;
      </button>
    </div>
  );
}
