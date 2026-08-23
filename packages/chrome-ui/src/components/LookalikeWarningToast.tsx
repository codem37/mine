import type { SecurityVerdict } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly verdict: SecurityVerdict;
  readonly onNavigateIntended: (url: string) => void;
  readonly onClose: () => void;
}

export function LookalikeWarningToast({ verdict, onNavigateIntended, onClose }: Props): JSX.Element {
  return (
    <div className="lookalike-toast" data-testid="lookalike-toast">
      <div className="lookalike-toast__content">
        <span className="lookalike-toast__icon">⚠️</span>
        <div className="lookalike-toast__text">
          <strong>Possible Impersonation Domain</strong>
          <p>
            Current address <code>{verdict.url}</code> resembles a legitimate website.
          </p>
          {verdict.intendedUrl ? (
            <p>
              Intended site: <strong>{verdict.intendedUrl}</strong>
            </p>
          ) : null}
        </div>
      </div>

      <div className="lookalike-toast__actions">
        {verdict.intendedUrl ? (
          <button
            type="button"
            className="glass-btn glass-btn--sm glass-btn--primary"
            onClick={() => onNavigateIntended(verdict.intendedUrl!)}
          >
            Go to {verdict.intendedUrl}
          </button>
        ) : null}
        <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>
          Ignore
        </button>
      </div>
    </div>
  );
}
