import { useState } from "react";
import type { SecurityVerdict } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly verdict: SecurityVerdict;
  readonly onGoBack: () => void;
  readonly onContinueAnyway: () => void;
}

export function SecurityInterstitial({ verdict, onGoBack, onContinueAnyway }: Props): JSX.Element {
  const [showDetails, setShowDetails] = useState(false);

  const isPhishing = verdict.category === "phishing";
  const title = isPhishing ? "Dangerous Phishing Site" : "Dangerous Malware Website";
  const desc = isPhishing
    ? "This website is known to be associated with phishing. It may attempt to steal passwords, payment details, or personal information."
    : "This website is associated with malicious software that may harm your computer.";

  return (
    <div className="security-interstitial" data-testid="security-interstitial">
      <div className="security-interstitial__card">
        <div className="security-interstitial__icon">⛔</div>
        <h1 className="security-interstitial__title">{title}</h1>
        <p className="security-interstitial__desc">{desc}</p>
        <span className="security-interstitial__url">{verdict.url}</span>

        {/* Primary Safe Action */}
        <div className="security-interstitial__actions">
          <button
            type="button"
            className="glass-btn glass-btn--primary security-interstitial__btn-back"
            onClick={onGoBack}
            autoFocus
          >
            Go Back
          </button>

          <button
            type="button"
            className="glass-btn glass-btn--sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "Details"}
          </button>

          <button
            type="button"
            className="glass-btn glass-btn--sm security-interstitial__btn-continue"
            onClick={onContinueAnyway}
          >
            Continue anyway (15m exception)
          </button>
        </div>

        {/* Details Panel */}
        {showDetails ? (
          <div className="security-interstitial__details" data-testid="interstitial-details">
            <div><strong>Threat Category:</strong> {verdict.category}</div>
            <div><strong>Severity Level:</strong> {verdict.severity} / 4</div>
            <div><strong>Detected By:</strong> {verdict.source}</div>
            {verdict.reason ? <div><strong>Reason:</strong> {verdict.reason}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
