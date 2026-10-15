import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    try { const data = await apiRequest("/bookings/my"); setBookings(data.bookings || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function cancel(id) {
    if (!window.confirm("Cancel this booking request?")) return;
    try { await apiRequest(`/bookings/${id}/cancel`, { method: "PATCH", body: JSON.stringify({ reason: "Cancelled by customer" }) }); await load(); }
    catch (err) { setError(err.message); }
  }
  if (loading) return <p>Loading your bookings...</p>;
  return <section className="content-page"><p className="eyebrow">Customer dashboard</p><h1>My bookings</h1>
    {error && <div className="alert alert-error">{error}</div>}
    {!bookings.length && !error && <div className="empty-state"><h2>No bookings yet</h2><p>Your service requests will appear here.</p><Link className="button" to="/providers">Find a provider</Link></div>}
    <div className="booking-list">{bookings.map(b => <article className="booking-card" key={b.id}>
      <div className="booking-card-top"><div><span className="eyebrow">Booking #{b.id}</span><h2>{b.problem_title}</h2><p>{b.business_name} · {b.service_category}</p></div><span className={`status-pill status-${b.status}`}>{b.status.replaceAll("_"," ")}</span></div>
      <p>{b.preferred_date?.slice(0,10)} at {String(b.preferred_time).slice(0,5)} · {b.area}, {b.city}</p>
      <div className="button-row"><Link className="button button-outline" to={`/bookings/${b.id}`}>View details</Link>{["requested","accepted","on_the_way"].includes(b.status) && <button className="button button-danger" onClick={() => cancel(b.id)}>Cancel</button>}</div>
    </article>)}</div>
  </section>;
}
