import { useState, useEffect } from "react";
import type { SecurityEvent } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly onClose: () => void;
}

export function SecurityEventsModal({ onClose }: Props): JSX.Element {
  const [events, setEvents] = useState<readonly SecurityEvent[]>([]);

  useEffect(() => {
    let active = true;
    if (window.mine.getSecurityEvents) {
      void window.mine.getSecurityEvents().then((res) => {
        if (active && res.ok && res.value) {
          setEvents(res.value);
        }
      });
    }
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="security-events-modal-overlay" onClick={onClose} data-testid="security-events-modal">
      <div className="security-events-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="security-events-modal__header">
          <h3>Security Event History</h3>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        {events.length === 0 ? (
          <div className="security-events-empty">No security events logged.</div>
        ) : (
          <div className="security-events-list">
            {events.map((evt) => (
              <div key={evt.id} className="security-event-row">
                <div className="security-event__meta">
                  <span className={`security-event__badge security-event__badge--${evt.action}`}>
                    {evt.threatType.toUpperCase()}
                  </span>
                  <span className="security-event__time">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                <span className="security-event__domain">{evt.domain}</span>
                <span className="security-event__source">Source: {evt.source}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
