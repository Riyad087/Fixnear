import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function BookingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    provider_id: id, service_category: "", problem_title: "", problem_description: "",
    service_address: "", city: "", area: "", preferred_date: "", preferred_time: "",
    urgency: "normal", latitude: "", longitude: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const payload = { ...form, latitude: form.latitude || null, longitude: form.longitude || null };
      const result = await apiRequest("/bookings", { method: "POST", body: JSON.stringify(payload) });
      navigate(`/bookings/${result.booking_id}`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="form-page">
    <Link className="back-link" to={`/providers/${id}`}>← Back to provider</Link>
    <div className="form-card">
      <p className="eyebrow">Module 2 · Service request</p><h1>Book a service</h1>
      <p className="muted">Submit your request. The provider must accept it before it is confirmed.</p>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={submit} className="form-grid">
        <label>Service category<input required name="service_category" value={form.service_category} onChange={update} placeholder="e.g. Electrician" /></label>
        <label>Problem title<input required maxLength="150" name="problem_title" value={form.problem_title} onChange={update} /></label>
        <label className="full-width">Describe the problem<textarea required name="problem_description" value={form.problem_description} onChange={update} rows="4" /></label>
        <label className="full-width">Service address<input required name="service_address" value={form.service_address} onChange={update} /></label>
        <label>City<input required name="city" value={form.city} onChange={update} /></label>
        <label>Area<input required name="area" value={form.area} onChange={update} /></label>
        <label>Preferred date<input required type="date" min={new Date().toISOString().slice(0,10)} name="preferred_date" value={form.preferred_date} onChange={update} /></label>
        <label>Preferred time<input required type="time" name="preferred_time" value={form.preferred_time} onChange={update} /></label>
        <label>Urgency<select name="urgency" value={form.urgency} onChange={update}><option value="normal">Normal</option><option value="urgent">Urgent</option></select></label>
        <label>Latitude (optional)<input type="number" step="any" name="latitude" value={form.latitude} onChange={update} /></label>
        <label>Longitude (optional)<input type="number" step="any" name="longitude" value={form.longitude} onChange={update} /></label>
        <div className="full-width"><button className="button" disabled={busy}>{busy ? "Submitting..." : "Review & submit request"}</button></div>
      </form>
    </div>
  </section>;
}
