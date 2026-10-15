import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function MatchingResults() {
  const [form, setForm] = useState({ category: "", city: "", area: "", latitude: "", longitude: "" });
  const [providers, setProviders] = useState([]);
  const [algorithm, setAlgorithm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  function update(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function search(e) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const query = new URLSearchParams();
      Object.entries(form).forEach(([k,v]) => { if (v !== "") query.set(k,v); });
      const data = await apiRequest(`/matching/providers?${query.toString()}`);
      setProviders(data.providers || []); setAlgorithm(data.algorithm || "");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return <section className="content-page"><p className="eyebrow">Rule-based recommendations</p><h1>Smart provider matching</h1>
    <p>Matches verified, available providers by category, area and available distance data.</p>
    <form className="filter-panel" onSubmit={search}>
      <label>Service category<input required name="category" value={form.category} onChange={update} placeholder="Electrician" /></label>
      <label>City<input name="city" value={form.city} onChange={update} /></label><label>Area<input name="area" value={form.area} onChange={update} /></label>
      <label>Latitude (optional)<input type="number" step="any" name="latitude" value={form.latitude} onChange={update} /></label>
      <label>Longitude (optional)<input type="number" step="any" name="longitude" value={form.longitude} onChange={update} /></label>
      <button className="button" disabled={loading}>{loading ? "Finding..." : "Find matches"}</button>
    </form>
    {error && <div className="alert alert-error">{error}</div>}
    {algorithm && <p className="muted">{algorithm}</p>}
    <div className="provider-grid">{providers.map(p=><article className="provider-card" key={p.id}>
      <div className="provider-card-top"><span className="badge badge-verified">✓ Verified</span><span className="match-score">{p.match_score}/100</span></div>
      <h2>{p.business_name}</h2><p>{p.service_category} · {p.area}, {p.city}</p>
      <p>★ {Number(p.rating || 0).toFixed(1)} ({p.total_reviews || 0} reviews)</p>
      <p>{p.distance_km == null ? "Distance unavailable" : `${p.distance_km} km away`}</p>
      <p><strong>{p.price_range || "Negotiable"}</strong></p>
      <ul>{p.match_reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>
      <Link className="button" to={`/providers/${p.id}`}>View provider</Link>
    </article>)}</div>
  </section>;
}
