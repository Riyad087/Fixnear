import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function Profile({ onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest("/profile");
        setUser(data.user || data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) return <div className="loading-state"><span className="spinner" /> Loading your profile...</div>;

  if (error) {
    return (
      <div className="empty-state">
        <h2>Could not load your profile</h2>
        <p>{error}</p>
        <button className="button button-outline" onClick={onLogout}>Clear session</button>
      </div>
    );
  }

  return (
    <section className="profile-page">
      <div className="page-heading">
        <p className="eyebrow">Your account</p>
        <h1>My profile</h1>
        <p className="muted">Your basic account information.</p>
      </div>
      <div className="account-card">
        <div className="account-avatar">{(user?.name || "U").charAt(0).toUpperCase()}</div>
        <div className="account-main">
          <h2>{user?.name || "FixNear user"}</h2>
          <span className="badge badge-muted">{user?.role || "customer"}</span>
        </div>
        <div className="account-details">
          <div><span>Email</span><strong>{user?.email || "—"}</strong></div>
          <div><span>Phone</span><strong>{user?.phone || "—"}</strong></div>
          <div><span>City</span><strong>{user?.city || "—"}</strong></div>
          <div><span>Area</span><strong>{user?.area || "—"}</strong></div>
        </div>
        <div className="account-actions">
          <Link className="button" to="/providers">Find a provider</Link>
          <button className="button button-outline" onClick={onLogout}>Log out</button>
        </div>
      </div>
    </section>
  );
}
