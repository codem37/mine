import { useEffect, useRef, useState } from "react";
import type { ShieldStats, TabId } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly activeTabId: TabId | null;
  readonly activeUrl: string;
  readonly shield: ShieldStats | null;
  readonly onToggleSiteInfo?: () => void;
}

function ShieldGlyph(): JSX.Element {
  return (
    <svg
      className="shieldtoggle__glyph"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        d="M8 1.5 L13.5 3.5 V7.5 C13.5 11 11 13.5 8 14.8 C5 13.5 2.5 11 2.5 7.5 V3.5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AddressBar({ activeTabId, activeUrl, shield, onToggleSiteInfo }: Props): JSX.Element {
  const [value, setValue] = useState(activeUrl);
  const focused = useRef(false);
  const shieldOn = shield?.enabled !== false;

  let isSecure = true;
  try {
    const parsed = new URL(activeUrl);
    isSecure = parsed.protocol === "https:" || parsed.protocol === "mine:";
  } catch {
    // default
  }

  useEffect(() => {
    if (!focused.current) setValue(activeUrl);
  }, [activeUrl]);

  return (
    <form
      className="addressbar"
      data-testid="addressbar"
      onSubmit={(event) => {
        event.preventDefault();
        if (activeTabId === null) return;
        const raw = value.trim();
        if (raw === "") return;
        const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
          ? raw
          : `https://${raw}`;
        void window.mine.navigate({ tabId: activeTabId, url }).then((result) => {
          if (!result.ok) console.error(result.error.message);
        });
      }}
    >
      <button
        type="button"
        className="addressbar__security"
        title="Site Information"
        onClick={onToggleSiteInfo}
        aria-label="Site security status"
      >
        {isSecure ? "🔒" : "⚠️"}
      </button>

      <input
        value={value}
        spellCheck={false}
        aria-label="address"
        placeholder={activeTabId === null ? "no active tab" : "search or address"}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setValue(activeUrl);
        }}
        onChange={(e) => setValue(e.target.value)}
      />

      <button
        type="button"
        className={
          "addressbar__shield" + (shieldOn ? "" : " addressbar__shield--off")
        }
        aria-label={shieldOn ? "turn shield off" : "turn shield on"}
        aria-pressed={shieldOn}
        disabled={shield === null}
        title={shieldOn ? "Shield is active (click for page info)" : "Shield is disabled"}
        onClick={onToggleSiteInfo}
      >
        <ShieldGlyph />
        {shield?.blockedCount ? (
          <span className="addressbar__shield-badge">{shield.blockedCount}</span>
        ) : null}
      </button>
    </form>
  );
}
