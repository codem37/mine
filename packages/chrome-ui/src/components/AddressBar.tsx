import { useEffect, useRef, useState } from "react";
import type { TabId } from "@mine/contracts";
import type { JSX } from "react";

const mine = window.mine;

interface Props {
  activeTabId: TabId | null;
  activeUrl: string;
}

export function AddressBar({ activeTabId, activeUrl }: Props): JSX.Element {
  const [value, setValue] = useState(activeUrl);
  const focused = useRef(false);

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
        void mine.navigate({ tabId: activeTabId, url }).then((result) => {
          if (!result.ok) console.error(result.error.message);
        });
      }}
    >
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
    </form>
  );
}
