import { useEffect, useState, useRef } from "react";
import type { JSX, FormEvent } from "react";
import type { FilterListInfo, ShieldDiagnostics } from "@mine/contracts";

interface Props {
  readonly onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  ads: "Ads",
  trackers: "Privacy / Trackers",
  mobile: "Mobile Ads",
  custom: "Custom",
};

export function FilterListModal({ onClose }: Props): JSX.Element {
  const [lists, setLists] = useState<FilterListInfo[]>([]);
  const [diagnostics, setDiagnostics] = useState<ShieldDiagnostics | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [customUrlError, setCustomUrlError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [addingList, setAddingList] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reload = (): void => {
    if (window.mine.getFilterLists) {
      void window.mine.getFilterLists().then((res) => {
        if (res.ok && Array.isArray(res.value)) setLists(res.value as FilterListInfo[]);
      });
    }
    if (window.mine.getShieldDiagnostics) {
      void window.mine.getShieldDiagnostics().then((res) => {
        if (res.ok && res.value) setDiagnostics(res.value as ShieldDiagnostics);
      });
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleForceUpdate = (): void => {
    setUpdating(true);
    setUpdateMsg("");
    void window.mine.forceUpdateLists().then(() => {
      setUpdateMsg("Lists updated successfully.");
      reload();
    }).catch(() => {
      setUpdateMsg("Update failed. Check your connection.");
    }).finally(() => setUpdating(false));
  };

  const handleAddCustomList = (e: FormEvent): void => {
    e.preventDefault();
    setCustomUrlError("");
    if (!customUrl.startsWith("https://")) {
      setCustomUrlError("Custom filter list URLs must use HTTPS.");
      inputRef.current?.focus();
      return;
    }
    setAddingList(true);
    void window.mine.addCustomList({ url: customUrl }).then(() => {
      setCustomUrl("");
      reload();
    }).catch(() => {
      setCustomUrlError("Failed to add list. Check the URL and try again.");
    }).finally(() => setAddingList(false));
  };

  const handleRemoveList = (name: string): void => {
    void window.mine.removeCustomList(name).then(() => reload());
  };

  const byCategory = lists.reduce<Record<string, FilterListInfo[]>>((acc, list) => {
    // FilterListInfo does not include category; group custom (optional+custom name) separately
    const cat = (list as FilterListInfo & { category?: string }).category ??
      (list.optional ? "custom" : "ads");
    acc[cat] = [...(acc[cat] ?? []), list];
    return acc;
  }, {});

  return (
    <div className="filter-list-modal-overlay" onClick={onClose} data-testid="filter-list-modal">
      <div className="filter-list-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="filter-list-modal__header">
          <h3>Filter Lists</h3>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose} aria-label="Close">✕</button>
        </header>

        {/* Diagnostics strip */}
        {diagnostics && (
          <div className="filter-list-diagnostics">
            <span>Engine: <strong>{diagnostics.engineState}</strong></span>
            <span className="sep">·</span>
            <span><strong>{diagnostics.networkRules.toLocaleString()}</strong> network rules</span>
            <span className="sep">·</span>
            <span><strong>{diagnostics.cosmeticRules.toLocaleString()}</strong> cosmetic rules</span>
            <span className="sep">·</span>
            <span>{diagnostics.listCount} lists loaded</span>
          </div>
        )}

        {/* Per-category list tables */}
        {Object.entries(byCategory).map(([cat, catLists]) => (
          <section key={cat} className="filter-list-section">
            <h4 className="filter-list-section__title">{CATEGORY_LABELS[cat] ?? cat}</h4>
            <table className="filter-list-table">
              <thead>
                <tr>
                  <th>List</th>
                  <th>Rules</th>
                  <th>Last Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {catLists.map((list) => (
                  <tr key={list.name}>
                    <td className="filter-list-name">{list.name}</td>
                    <td className="filter-list-count">{list.ruleCount.toLocaleString()}</td>
                    <td className="filter-list-updated">
                      {list.lastUpdated
                        ? new Date(list.lastUpdated).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {list.optional && cat === "custom" ? (
                        <button
                          type="button"
                          className="glass-btn glass-btn--sm glass-btn--danger"
                          onClick={() => handleRemoveList(list.name)}
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="filter-list-builtin">Built-in</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

        {/* Add custom list */}
        <section className="filter-list-section">
          <h4 className="filter-list-section__title">Add Custom List</h4>
          <form className="filter-list-add-form" onSubmit={handleAddCustomList}>
            <input
              ref={inputRef}
              type="url"
              className="filter-list-url-input"
              placeholder="https://example.com/filters.txt"
              value={customUrl}
              onChange={(e) => { setCustomUrl(e.target.value); setCustomUrlError(""); }}
              aria-label="Custom filter list URL (HTTPS only)"
              aria-invalid={!!customUrlError}
              aria-describedby={customUrlError ? "custom-url-error" : undefined}
              disabled={addingList}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="glass-btn--pill"
              disabled={addingList || !customUrl}
            >
              {addingList ? "Adding…" : "➕ Add List"}
            </button>
          </form>
          {customUrlError && (
            <p id="custom-url-error" className="filter-list-error">{customUrlError}</p>
          )}
          <p className="filter-list-privacy-note">
            🔒 No browsing data is included in filter list updates. Only filter rule files are downloaded.
          </p>
        </section>

        <footer className="filter-list-modal__footer">
          {updateMsg && <span className="filter-list-update-msg">{updateMsg}</span>}
          <button
            type="button"
            className="glass-btn--pill glass-btn--primary"
            onClick={handleForceUpdate}
            disabled={updating}
          >
            {updating ? "Updating…" : "🔄 Force Update All"}
          </button>
        </footer>
      </div>
    </div>
  );
}
