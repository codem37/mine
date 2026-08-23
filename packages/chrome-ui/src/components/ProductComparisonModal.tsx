import type { SearchResult } from "@mine/contracts";
import type { JSX } from "react";

interface Props {
  readonly products: readonly SearchResult[];
  readonly onClose: () => void;
}

export function ProductComparisonModal({ products, onClose }: Props): JSX.Element {
  return (
    <div className="product-modal-overlay" onClick={onClose} data-testid="product-comparison-modal">
      <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="product-modal__header">
          <h3>Product Comparison ({products.length})</h3>
          <button type="button" className="glass-btn glass-btn--sm" onClick={onClose}>✕</button>
        </header>

        <div className="product-modal__table-wrap">
          <table className="product-modal__table">
            <thead>
              <tr>
                <th>Attribute</th>
                {products.map((p) => (
                  <th key={p.id}>{p.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="prop-name">Price</td>
                {products.map((p) => (
                  <td key={p.id} className="prop-val">{p.currency || "₹"}{p.price}</td>
                ))}
              </tr>
              <tr>
                <td className="prop-name">Rating</td>
                {products.map((p) => (
                  <td key={p.id} className="prop-val">★ {p.rating || 4.5} ({p.reviewCount || 50})</td>
                ))}
              </tr>
              <tr>
                <td className="prop-name">Brand</td>
                {products.map((p) => (
                  <td key={p.id} className="prop-val">{p.specs?.brand || "N/A"}</td>
                ))}
              </tr>
              <tr>
                <td className="prop-name">CPU</td>
                {products.map((p) => (
                  <td key={p.id} className="prop-val">{p.specs?.cpu || "N/A"}</td>
                ))}
              </tr>
              <tr>
                <td className="prop-name">RAM</td>
                {products.map((p) => (
                  <td key={p.id} className="prop-val">{p.specs?.ram || "N/A"}</td>
                ))}
              </tr>
              <tr>
                <td className="prop-name">GPU</td>
                {products.map((p) => (
                  <td key={p.id} className="prop-val">{p.specs?.gpu || "N/A"}</td>
                ))}
              </tr>
              <tr>
                <td className="prop-name">Storage</td>
                {products.map((p) => (
                  <td key={p.id} className="prop-val">{p.specs?.storage || "N/A"}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
