import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function Quotes() {
  const [quotes,setQuotes] = useState([]);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(null);
  async function load() {
    try { const d = await apiRequest("/quotes/my"); setQuotes(d.quotes || []); }
    catch(e) { setError(e.message); }
  }
  useEffect(()=>{load();},[]);
  async function decide(id, action) {
    setBusy(id); setError("");
    try { await apiRequest(`/quotes/${id}/${action}`,{method:"PATCH",body:JSON.stringify({})}); await load(); }
    catch(e){setError(e.message);} finally{setBusy(null);}
  }
  return <section className="content-page"><p className="eyebrow">Price estimates</p><h1>My quote requests</h1>
    {error && <div className="alert alert-error">{error}</div>}
    {!quotes.length && <div className="empty-state"><h2>No quotes yet</h2><p>Request an estimate from a provider profile.</p></div>}
    <div className="booking-list">{quotes.map(q=><article className="booking-card" key={q.id}>
      <div className="booking-card-top"><div><span className="eyebrow">Quote #{q.id}</span><h2>{q.business_name || q.customer_name || "Service quote"}</h2></div><span className="status-pill">{q.status}</span></div>
      <p>{q.problem_description}</p><p><strong>Estimate:</strong> {q.estimated_price == null ? "Waiting for provider" : `৳${Number(q.estimated_price).toFixed(2)}`}</p>
      {q.provider_message && <p>{q.provider_message}</p>}
      {q.status === "quoted" && <div className="button-row"><button className="button" disabled={busy===q.id} onClick={()=>decide(q.id,"accept")}>Accept quote</button><button className="button button-danger" disabled={busy===q.id} onClick={()=>decide(q.id,"reject")}>Reject quote</button></div>}
    </article>)}</div>
  </section>;
}
