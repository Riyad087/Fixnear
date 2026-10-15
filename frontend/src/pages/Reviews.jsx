import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function Reviews() {
  const [reviews,setReviews]=useState([]);
  const [error,setError]=useState("");
  async function load(){try{const d=await apiRequest("/reviews/my");setReviews(d.reviews||[]);}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[]);
  return <section className="content-page"><p className="eyebrow">Customer feedback</p><h1>My reviews</h1>
    {error&&<div className="alert alert-error">{error}</div>}
    {!reviews.length&&!error&&<div className="empty-state">You haven't submitted any reviews yet. Completed bookings can be reviewed from the booking details page.</div>}
    <div className="booking-list">{reviews.map(r=><article className="booking-card" key={r.id}><div className="booking-card-top"><h2>{r.business_name}</h2><strong>★ {r.rating}/5</strong></div><p>{r.review_text}</p><small>Booking #{r.booking_id} · {new Date(r.created_at).toLocaleDateString()}</small></article>)}</div>
  </section>;
}
