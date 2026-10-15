import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const categories=[["provider_did_not_arrive","Provider did not arrive"],["poor_service","Poor service quality"],["unexpected_price","Unexpected price"],["inappropriate_behavior","Inappropriate behavior"],["booking_dispute","Booking dispute"],["misleading_information","Misleading provider information"],["other","Other"]];
export default function Complaints(){
 const [form,setForm]=useState({booking_id:"",category:"poor_service",description:""}),[items,setItems]=useState([]),[error,setError]=useState(""),[message,setMessage]=useState("");
 async function load(){try{const d=await apiRequest("/complaints/my");setItems(d.complaints||[]);}catch(e){setError(e.message);}}
 useEffect(()=>{load();},[]);
 async function submit(e){e.preventDefault();setError("");setMessage("");try{const d=await apiRequest("/complaints",{method:"POST",body:JSON.stringify(form)});setMessage(d.message);setForm({booking_id:"",category:"poor_service",description:""});await load();}catch(e){setError(e.message);}}
 return <section className="content-page"><p className="eyebrow">Customer support</p><h1>Complaints</h1>
 {error&&<div className="alert alert-error">{error}</div>}{message&&<div className="alert alert-success">{message}</div>}
 <div className="form-card"><h2>Report a booking issue</h2><form className="form-grid" onSubmit={submit}>
 <label>Booking ID<input required type="number" min="1" value={form.booking_id} onChange={e=>setForm({...form,booking_id:e.target.value})}/></label>
 <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c[0]} value={c[0]}>{c[1]}</option>)}</select></label>
 <label className="full-width">Describe the issue<textarea required maxLength="5000" rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
 <div className="full-width"><button className="button">Submit complaint</button></div></form></div>
 <h2>My complaints</h2><div className="booking-list">{items.map(c=><article className="booking-card" key={c.id}><div className="booking-card-top"><h2>Complaint #{c.id}</h2><span className="status-pill">{c.status.replaceAll("_"," ")}</span></div><p>{c.category.replaceAll("_"," ")} · {c.business_name}</p><p>{c.description}</p>{c.admin_response&&<p><strong>Admin response:</strong> {c.admin_response}</p>}<small>{new Date(c.created_at).toLocaleString()}</small></article>)}</div>
 </section>;
}
