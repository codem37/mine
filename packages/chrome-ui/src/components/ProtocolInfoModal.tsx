import { useState } from "react";
import type { ProtocolInfoPayload } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly payload: ProtocolInfoPayload;
  readonly onClose: () => void;
  readonly onOpenStorage: () => void;
}

export function ProtocolInfoModal({ payload, onClose, onOpenStorage }: Props): JSX.Element {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (field: string, text: string): void => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const isEns = payload.protocol === "ens";

  return (
    <div className="protocol-info-overlay" onClick={onClose} data-testid="protocol-info-modal">
      <div className="protocol-info-card" onClick={(e) => e.stopPropagation()}>
        <header className="protocol-info__header">
          <h3>Protocol Information</h3>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        <div className="protocol-info__body">
          <div className="protocol-info-row">
            <span>Protocol</span>
            <span className="protocol-info__val">{payload.protocol.toUpperCase()}</span>
          </div>

          {isEns && payload.ens ? (
            <>
              <div className="protocol-info-row">
                <span>ENS Name</span>
                <span className="protocol-info__val">{payload.ens.name}</span>
              </div>

              {payload.ens.address ? (
                <div className="protocol-info-row">
                  <span>Resolved Address</span>
                  <span className="protocol-info__val protocol-info__val--mono">
                    {payload.ens.address.substring(0, 8)}...{payload.ens.address.substring(36)}
                  </span>
                </div>
              ) : null}

              {payload.ens.contentTarget ? (
                <div className="protocol-info-row">
                  <span>Resolved Content</span>
                  <span className="protocol-info__val protocol-info__val--mono">
                    {payload.ens.contentTarget.substring(0, 20)}...
                  </span>
                </div>
              ) : null}
            </>
          ) : null}

          {payload.ipfs ? (
            <>
              <div className="protocol-info-row">
                <span>Content ID (CID)</span>
                <span className="protocol-info__val protocol-info__val--mono">
                  {payload.ipfs.cid.substring(0, 16)}...
                </span>
              </div>

              <div className="protocol-info-row">
                <span>Resolution</span>
                <span className="protocol-info__val">{payload.ipfs.gatewayUsed ?? "Local Helia Node"}</span>
              </div>

              <div className="protocol-info-row">
                <span>Cache Status</span>
                <span className="protocol-info__val">{payload.ipfs.cached ? "Cached locally" : "Not cached"}</span>
              </div>

              <div className="protocol-info-row">
                <span>Pin Status</span>
                <span className="protocol-info__val">{payload.ipfs.pinned ? "✓ Pinned locally" : "Not pinned"}</span>
              </div>
            </>
          ) : null}

          <div className="protocol-info-row">
            <span>Safety</span>
            <span className="protocol-info__val protocol-info__val--safe">
              {payload.safetyVerdict?.state === "blocked" ? "⛔ Blocked" : "✓ No known threat information"}
            </span>
          </div>
        </div>

        <footer className="protocol-info__footer">
          {isEns && payload.ens ? (
            <button
              type="button"
              className="glass-btn glass-btn--sm"
              onClick={() => handleCopy("ens", payload.ens!.name)}
            >
              {copiedField === "ens" ? "✓ Copied" : "Copy ENS"}
            </button>
          ) : null}

          {payload.ipfs ? (
            <button
              type="button"
              className="glass-btn glass-btn--sm"
              onClick={() => handleCopy("cid", payload.ipfs!.cid)}
            >
              {copiedField === "cid" ? "✓ Copied" : "Copy CID"}
            </button>
          ) : null}

          <button type="button" className="glass-btn glass-btn--sm" onClick={onOpenStorage}>
            IPFS Storage Manager
          </button>
        </footer>
      </div>
    </div>
  );
}
