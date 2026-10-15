import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function ProviderDashboard() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    try { const data = await apiRequest("/bookings/provider"); setBookings(data.bookings || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function action(id, endpoint, body = {}) {
    setError("");
    try { await apiRequest(`/bookings/${id}/${endpoint}`, { method: "PATCH", body: JSON.stringify(body) }); await load(); }
    catch (err) { setError(err.message); }
  }
  if (loading) return <p>Loading provider dashboard...</p>;
  return <section className="content-page"><p className="eyebrow">Provider dashboard</p><h1>Service requests</h1>
    {error && <div className="alert alert-error">{error}</div>}
    {!bookings.length && <div className="empty-state"><h2>No requests yet</h2><p>New customer requests will appear here.</p></div>}
    <div className="booking-list">{bookings.map(b => <article className="booking-card" key={b.id}>
      <div className="booking-card-top"><div><span className="eyebrow">Booking #{b.id}</span><h2>{b.problem_title}</h2><p>{b.customer_name} · {b.customer_phone}</p></div><span className={`status-pill status-${b.status}`}>{b.status.replaceAll("_"," ")}</span></div>
      <p>{b.problem_description}</p><p><strong>Address:</strong> {b.service_address}, {b.area}, {b.city}</p><p><strong>When:</strong> {String(b.preferred_date).slice(0,10)} at {String(b.preferred_time).slice(0,5)} · {b.urgency}</p>
      <div className="button-row">
        {b.status === "requested" && <><button className="button" onClick={() => action(b.id,"accept")}>Accept</button><button className="button button-danger" onClick={() => action(b.id,"reject",{reason:"Provider declined request"})}>Reject</button></>}
        {b.status === "accepted" && <button className="button" onClick={() => action(b.id,"status",{status:"on_the_way"})}>On the way</button>}
        {b.status === "on_the_way" && <button className="button" onClick={() => action(b.id,"status",{status:"in_service"})}>Start service</button>}
        {b.status === "in_service" && <button className="button" onClick={() => action(b.id,"status",{status:"completed"})}>Mark completed</button>}
      </div>
    </article>)}</div>
  </section>;
}
