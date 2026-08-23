import { useState, useEffect } from "react";
import type { SubsystemHealth } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly onClose: () => void;
}

export function HealthRecoveryModal({ onClose }: Props): JSX.Element {
  const [healthList, setHealthList] = useState<readonly SubsystemHealth[]>([]);
  const [restartingId, setRestartingId] = useState<string | null>(null);

  const loadHealth = (): void => {
    if (window.mine.getSubsystemHealth) {
      void window.mine.getSubsystemHealth().then((res) => {
        if (res.ok && res.value) setHealthList(res.value);
      });
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleRestart = (id: string): void => {
    setRestartingId(id);
    if (window.mine.restartSubsystemComponent) {
      void window.mine.restartSubsystemComponent(id).then(() => {
        setTimeout(() => {
          setRestartingId(null);
          loadHealth();
        }, 500);
      });
    }
  };

  return (
    <div className="health-recovery-overlay" onClick={onClose} data-testid="health-recovery-modal">
      <div className="health-recovery-card" onClick={(e) => e.stopPropagation()}>
        <header className="health-recovery__header">
          <h3>Subsystem Health & Component Recovery</h3>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        <div className="health-recovery-list">
          {healthList.map((item) => (
            <div key={item.id} className="health-row">
              <div className="health-row__info">
                <span className={`health-status-dot health-status-dot--${item.status}`} />
                <span className="health-row__name">{item.name}</span>
                {item.details ? <span className="health-row__details">({item.details})</span> : null}
              </div>

              <button
                type="button"
                className="glass-btn glass-btn--sm"
                disabled={restartingId === item.id}
                onClick={() => handleRestart(item.id)}
              >
                {restartingId === item.id ? "Restarting..." : "Restart Subsystem"}
              </button>
            </div>
          ))}
        </div>

        <footer className="health-recovery__footer">
          <button type="button" className="glass-btn glass-btn--sm" onClick={loadHealth}>
            Re-run Health Check
          </button>
          <button type="button" className="glass-btn glass-btn--sm glass-btn--primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
