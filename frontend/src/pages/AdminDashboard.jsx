import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function AdminDashboard(){
 const [stats,setStats]=useState(null),[users,setUsers]=useState([]),[providers,setProviders]=useState([]),[bookings,setBookings]=useState([]),[applications,setApplications]=useState([]),[complaints,setComplaints]=useState([]),[logs,setLogs]=useState([]),[reviews,setReviews]=useState([]),[error,setError]=useState(""),[tab,setTab]=useState("overview"),[search,setSearch]=useState("");
 async function load(){
  setError("");
  try {
   const d=await apiRequest("/admin/dashboard");setStats(d.stats);
   const [u,p,b,v,c,a,r]=await Promise.all([
    apiRequest(`/admin/users?search=${encodeURIComponent(search)}`),apiRequest(`/admin/providers?search=${encodeURIComponent(search)}`),
    apiRequest("/admin/bookings"),apiRequest("/admin/verifications"),apiRequest("/admin/complaints"),
    apiRequest("/admin/audit-logs"),apiRequest("/admin/reviews")]);
   setUsers(u.users||[]);setProviders(p.providers||[]);setBookings(b.bookings||[]);setApplications(v.applications||[]);setComplaints(c.complaints||[]);setLogs(a.logs||[]);setReviews(r.reviews||[]);
  } catch(e){setError(e.message);}
 }
 useEffect(()=>{load();},[]);
 async function action(path,body={}){try{await apiRequest(path,{method:"PATCH",body:JSON.stringify(body)});await load();}catch(e){setError(e.message);}}
 const tabs=["overview","users","providers","verification","bookings","complaints","reviews","audit"];
 return <section className="content-page admin-page"><p className="eyebrow">Restricted area</p><h1>Admin dashboard</h1>
 {error&&<div className="alert alert-error">{error}</div>}
 <div className="admin-tabs">{tabs.map(t=><button className={tab===t?"button":"button button-outline"} key={t} onClick={()=>setTab(t)}>{t}</button>)}</div>
 {tab==="overview"&&<><div className="admin-stat-grid">{Object.entries(stats||{}).map(([k,v])=><div className="admin-stat" key={k}><span>{k.replace(/[A-Z]/g," $&")}</span><strong>{v}</strong></div>)}</div><p><Link to="/admin/verifications">Review provider applications →</Link></p></>}
 {["users","providers"].includes(tab)&&<><div className="admin-search"><input placeholder="Search by name, email, category or area" value={search} onChange={e=>setSearch(e.target.value)}/><button className="button" onClick={load}>Search</button></div><div className="admin-table-wrap"><table><thead><tr>{(tab==="users"?["ID","Name","Email","Role","Location"]:["ID","Business","Owner","Category","Location","Verified"]).map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{(tab==="users"?users:providers).map(x=><tr key={x.id}>{tab==="users"?<><td>{x.id}</td><td>{x.name}</td><td>{x.email}</td><td>{x.role}</td><td>{[x.area,x.city].filter(Boolean).join(", ")}</td></>:<><td>{x.id}</td><td>{x.business_name}</td><td>{x.owner_name}</td><td>{x.service_category}</td><td>{x.area}, {x.city}</td><td>{x.is_verified?"Yes":"No"}</td></>}</tr>)}</tbody></table></div></>}
 {tab==="verification"&&<div className="booking-list">{applications.map(a=><article className="booking-card" key={a.id}><div className="booking-card-top"><div><h2>{a.business_name}</h2><p>{a.owner_name} · {a.service_category}</p></div><span className="status-pill">{a.application_status}</span></div><pre className="json-preview">{JSON.stringify(typeof a.applicant_information==="string"?JSON.parse(a.applicant_information):a.applicant_information,null,2)}</pre><p>Document reference: {a.document_reference||"Not supplied"}</p><div className="button-row"><button className="button" onClick={()=>action(`/admin/verifications/${a.id}/approve`)}>Approve</button><button className="button button-danger" onClick={()=>{const reason=window.prompt("Reason for rejection:");if(reason)action(`/admin/verifications/${a.id}/reject`,{reason});}}>Reject</button></div></article>)}</div>}
 {tab==="bookings"&&<AdminTable rows={bookings} fields={["id","customer_name","business_name","service_category","status","created_at","completed_at"]}/>}
 {tab==="complaints"&&<div className="booking-list">{complaints.map(c=><ComplaintAdminCard key={c.id} complaint={c} action={action}/>)}</div>}
 {tab==="reviews"&&<div className="booking-list">{reviews.map(r=><article className="booking-card" key={r.id}><div className="booking-card-top"><h2>{r.business_name} · ★ {r.rating}/5</h2><span>Review #{r.id}</span></div><p>{r.customer_name} · Booking #{r.booking_id}</p><p>{r.review_text}</p><button className="button button-danger" onClick={()=>{const reason=window.prompt("Reason for hiding this review:");if(reason)action(`/admin/reviews/${r.id}/hide`,{reason});}}>Hide review</button></article>)}</div>}
 {tab==="audit"&&<AdminTable rows={logs} fields={["created_at","admin_name","action","entity_type","entity_id","reason"]}/>}
 </section>;
}
function AdminTable({rows,fields}){return <div className="admin-table-wrap"><table><thead><tr>{fields.map(f=><th key={f}>{f}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}>{fields.map(f=><td key={f}>{String(r[f]??"—")}</td>)}</tr>)}</tbody></table></div>}
function ComplaintAdminCard({complaint:c,action}){
 const [status,setStatus]=useState("under_review"),[note,setNote]=useState("");
 return <article className="booking-card"><div className="booking-card-top"><h2>Complaint #{c.id}</h2><span className="status-pill">{c.status}</span></div><p>{c.reporter_name} · {c.business_name} · {c.category}</p><p>{c.description}</p><div className="button-row"><select value={status} onChange={e=>setStatus(e.target.value)}><option value="under_review">Under review</option><option value="awaiting_response">Awaiting response</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="open">Open</option></select><input placeholder="Resolution/reason note" value={note} onChange={e=>setNote(e.target.value)}/><button className="button" onClick={()=>action(`/admin/complaints/${c.id}/status`,{status,resolution_notes:note,reason:note,admin_response:note})}>Update</button></div></article>;
}
