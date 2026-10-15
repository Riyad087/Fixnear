import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const initial={full_name:"",business_name:"",service_category:"",phone:"",city:"",area:"",description:"",document_reference:""};
export default function ProviderVerification(){
 const [form,setForm]=useState(initial),[applications,setApplications]=useState([]),[error,setError]=useState(""),[message,setMessage]=useState("");
 async function load(){try{const d=await apiRequest("/verification/my");setApplications(d.applications||[]);}catch(e){setError(e.message);}}
 useEffect(()=>{load();},[]);
 function change(e){setForm({...form,[e.target.name]:e.target.value});}
 async function submit(e){e.preventDefault();setError("");setMessage("");try{const d=await apiRequest("/verification/apply",{method:"POST",body:JSON.stringify(form)});setMessage(d.message);setForm(initial);await load();}catch(e){setError(e.message);}}
 return <section className="content-page"><p className="eyebrow">Provider account</p><h1>Provider verification</h1>
 {error&&<div className="alert alert-error">{error}</div>}{message&&<div className="alert alert-success">{message}</div>}
 <div className="form-card"><h2>Apply for verification</h2><p className="muted">Document reference is metadata only in this demo; do not enter a public URL to an identity document.</p>
 <form className="form-grid" onSubmit={submit}>
 {Object.entries({full_name:"Full name",business_name:"Business name",service_category:"Service category",phone:"Contact phone",city:"City",area:"Service area",description:"Professional description",document_reference:"Private document reference (optional)"}).map(([name,label])=><label key={name} className={name==="description"?"full-width":""}>{label}{name==="description"?<textarea required name={name} value={form[name]} onChange={change} rows="3"/>:<input required={name!=="document_reference"} name={name} value={form[name]} onChange={change}/>}</label>)}
 <div className="full-width"><button className="button">Submit application</button></div></form></div>
 <h2>Application history</h2><div className="booking-list">{applications.map(a=><article className="booking-card" key={a.id}><div className="booking-card-top"><strong>Application #{a.id}</strong><span className="status-pill">{a.application_status}</span></div><p>{a.rejection_reason||"No reviewer message."}</p><small>{new Date(a.created_at).toLocaleString()}</small></article>)}</div>
 </section>;
}
