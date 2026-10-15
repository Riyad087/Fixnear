import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function Notifications() {
  const [items,setItems] = useState([]);
  const [error,setError] = useState("");
  async function load(){try{const d=await apiRequest("/notifications");setItems(d.notifications||[]);}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[]);
  async function mark(id){try{await apiRequest(`/notifications/${id}/read`,{method:"PATCH"});await load();}catch(e){setError(e.message);}}
  return <section className="content-page"><h1>Notifications</h1>{error&&<div className="alert alert-error">{error}</div>}
    {!items.length&&<div className="empty-state">No notifications yet.</div>}
    <div className="booking-list">{items.map(n=><article className="booking-card" key={n.id}><div className="booking-card-top"><p>{n.message}</p>{!n.is_read&&<span className="status-pill">New</span>}</div><small>{new Date(n.created_at).toLocaleString()}</small>{!n.is_read&&<p><button className="button button-outline" onClick={()=>mark(n.id)}>Mark as read</button></p>}</article>)}</div>
  </section>;
}
