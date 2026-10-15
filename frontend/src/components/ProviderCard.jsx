import { Link } from "react-router-dom";

export default function ProviderCard({ provider, selected = false, onToggleCompare }) {
  const providerId = provider.id;
  const name = provider.business_name || "Local service provider";
  const location = [provider.area, provider.city].filter(Boolean).join(", ");
  const rating = Number(provider.rating || 0).toFixed(1);

  return (
    <article className="provider-card">
      <div className="provider-card-top">
        <div className="provider-avatar">{name.charAt(0).toUpperCase()}</div>
        {provider.is_verified ? (
          <span className="badge badge-verified"><span aria-hidden="true">✓</span> Verified</span>
        ) : (
          <span className="badge badge-muted">Not verified</span>
        )}
      </div>

      <div className="provider-card-body">
        <p className="eyebrow">{provider.service_category || "Local services"}</p>
        <h3>{name}</h3>
        <p className="muted location-line">⌖ {location || "Location not provided"}</p>
        <p className="provider-description">
          {provider.description || "Contact this provider to learn more about their services."}
        </p>

        <div className="provider-meta">
          <span><strong>★ {rating}</strong> <small>({provider.total_reviews || 0} reviews)</small></span>
          <span>{provider.is_available ? "● Available" : "● Unavailable"}</span>
        </div>
        <div className="provider-price">{provider.price_range || "Price negotiable"}</div>

        <div className="provider-card-actions">
          <Link className="button button-full" to={`/providers/${providerId}`}>View profile</Link>
          {onToggleCompare && (
            <label className="compare-check">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleCompare(provider)}
              />
              Compare
            </label>
          )}
        </div>
      </div>
    </article>
  );
}
