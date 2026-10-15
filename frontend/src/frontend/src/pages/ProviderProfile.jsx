import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function ProviderProfile() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProvider() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest(`/providers/${encodeURIComponent(id)}`);
        setProvider(data.provider || data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProvider();
  }, [id]);

  if (loading) return <div className="loading-state"><span className="spinner" /> Loading provider profile...</div>;
  if (error || !provider || !provider.id) {
    return <div className="empty-state"><h2>Provider not found</h2><p>{error || "This provider profile is unavailable."}</p><Link className="button" to="/providers">Back to providers</Link></div>;
  }

  const location = [provider.area, provider.city].filter(Boolean).join(", ");

  return (
    <section className="profile-page">
      <Link className="back-link" to="/providers">← Back to providers</Link>
      <div className="provider-profile-card">
        <div className="profile-cover">
          <div className="profile-avatar">{(provider.business_name || "P").charAt(0).toUpperCase()}</div>
          <div className="profile-cover-text">
            <p className="eyebrow">{provider.service_category}</p>
            <h1>{provider.business_name}</h1>
            <p>⌖ {location || "Location not provided"}</p>
          </div>
          {provider.is_verified ? <span className="badge badge-verified">✓ Verified provider</span> : <span className="badge badge-muted">Not verified</span>}
        </div>

        <div className="profile-details-grid">
          <div className="profile-main-details">
            <p className="eyebrow">About this provider</p>
            <h2>Services and experience</h2>
            <p className="description-text">{provider.description || "No description has been provided yet."}</p>
            <div className="detail-box-grid">
              <div className="detail-box"><span>Service category</span><strong>{provider.service_category || "—"}</strong></div>
              <div className="detail-box"><span>Service area</span><strong>{location || "—"}</strong></div>
              <div className="detail-box"><span>Service radius</span><strong>{provider.service_radius ? `${provider.service_radius} km` : "Not provided"}</strong></div>
              <div className="detail-box"><span>Availability</span><strong>{provider.is_available ? "Available" : "Currently unavailable"}</strong></div>
            </div>
          </div>
          <aside className="profile-side">
            <div className="rating-large">★ {Number(provider.rating || 0).toFixed(1)} <span>/ 5</span></div>
            <p className="muted">{provider.total_reviews || 0} reviews</p>
            <div className="side-divider" />
            <span className="side-label">Estimated price</span>
            <strong className="side-price">{provider.price_range || "Negotiable"}</strong>
            <div className="side-divider" />
            <span className="side-label">Public contact</span>
            <strong>{provider.contact_phone || provider.phone || "Contact information unavailable"}</strong>
            <div className="booking-placeholder">
              <strong>Booking coming in a future module</strong>
              <p>Booking and scheduling are not available in Module 1.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
