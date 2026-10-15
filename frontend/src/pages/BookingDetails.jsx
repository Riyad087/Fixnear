import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function ReviewForm({ bookingId }) {
  const [rating,setRating]=useState("5"),[reviewText,setReviewText]=useState(""),[message,setMessage]=useState(""),[error,setError]=useState("");
  async function submit(e){e.preventDefault();setError("");setMessage("");try{const d=await apiRequest("/reviews",{method:"POST",body:JSON.stringify({booking_id:bookingId,rating:Number(rating),review_text:reviewText})});setMessage(d.message);setReviewText("");}catch(e){setError(e.message);}}
  return <div className="form-card review-form"><h2>Review this completed service</h2>{error&&<div className="alert alert-error">{error}</div>}{message&&<div className="alert alert-success">{message}</div>}
  <form onSubmit={submit} className="form-grid"><label>Rating<select value={rating} onChange={e=>setRating(e.target.value)}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n>1?"s":""}</option>)}</select></label><label className="full-width">Your feedback<textarea required maxLength="2000" rows="3" value={reviewText} onChange={e=>setReviewText(e.target.value)}/></label><div className="full-width"><button className="button">Submit review</button></div></form></div>;
}

export default function BookingDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { apiRequest(`/bookings/${id}`).then(setData).catch(e => setError(e.message)); }, [id]);
  if (error) return <div className="empty-state"><h2>Could not load booking</h2><p>{error}</p><Link to="/bookings">Back to bookings</Link></div>;
  if (!data) return <p>Loading booking...</p>;
  const b = data.booking;
  return <section className="content-page"><Link className="back-link" to="/bookings">← My bookings</Link><p className="eyebrow">Booking #{b.id}</p><h1>{b.problem_title}</h1>
    <span className={`status-pill status-${b.status}`}>{b.status.replaceAll("_"," ")}</span>
    <div className="detail-box-grid">
      <div className="detail-box"><span>Provider</span><strong>{b.business_name}</strong></div>
      <div className="detail-box"><span>Service</span><strong>{b.service_category}</strong></div>
      <div className="detail-box"><span>Preferred date</span><strong>{String(b.preferred_date).slice(0,10)} · {String(b.preferred_time).slice(0,5)}</strong></div>
      <div className="detail-box"><span>Urgency</span><strong>{b.urgency}</strong></div>
      <div className="detail-box"><span>Address</span><strong>{b.service_address}, {b.area}, {b.city}</strong></div>
    </div>
    <h2>Problem description</h2><p>{b.problem_description}</p>
    {b.status === "completed" && <ReviewForm bookingId={b.id} />}
    <div className="button-row"><Link className="button button-outline" to="/complaints">Report an issue</Link></div>
    <h2>Booking timeline</h2>
    <ol className="timeline">{(data.history || []).map((h,i)=><li key={i}><strong>{h.new_status.replaceAll("_"," ")}</strong><p>{h.note || "Status updated"}</p><small>{new Date(h.created_at).toLocaleString()}</small></li>)}</ol>
  </section>;
}
