import type { JSX } from "react";
const mine = window.mine;

export function WindowControls({ maximized }: { maximized: boolean }): JSX.Element {
  return (
    <div className="wincontrols" data-testid="window-controls">
      <button
        aria-label="minimize window"
        onClick={() => void mine.minimizeWindow()}
      >
        &#x2500;
      </button>
      <button
        aria-label={maximized ? "restore window" : "maximize window"}
        onClick={() => void mine.toggleMaximizeWindow()}
      >
        {maximized ? "\u2750" : "\u25A1"}
      </button>
      <button
        className="wincontrols__close"
        aria-label="close window"
        onClick={() => void mine.closeWindow()}
      >
        &#x2715;
      </button>
    </div>
  );
}
