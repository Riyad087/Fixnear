import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, saveToken } from "../services/api";

const initialForm = {
  name: "", email: "", phone: "", password: "", city: "", area: "", accountType: "customer", business_name: "", service_category: "", description: "", service_radius: "10", price_range: "",
};

export default function Register({ onRegister }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = form.accountType === "provider" ? "/auth/register-provider" : "/auth/register";
      const payload = { ...form };
      delete payload.accountType;
      await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccess(form.accountType === "provider"
        ? "Provider account created. Your profile is pending admin verification. You can now log in."
        : "Customer account created. You can now log in.");
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">Join FixNear</p>
        <h1>Local help starts with a simple step.</h1>
        <p>Create an account to keep your profile in one place and explore local service providers.</p>
        <div className="auth-benefit"><span>✓</span> Compare provider details</div>
        <div className="auth-benefit"><span>✓</span> See service areas and availability</div>
        <div className="auth-benefit"><span>✓</span> Make more informed choices</div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Create your FixNear account</h2>
        <p className="muted">All fields are required unless marked optional.</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}

        <div className="form-grid">
          <label className="span-two">Account type
            <select name="accountType" value={form.accountType} onChange={updateForm}>
              <option value="customer">Customer — find and book services</option>
              <option value="provider">Service provider — offer services</option>
            </select>
          </label>
          <label>Full name<input name="name" value={form.name} onChange={updateForm} required maxLength="100" autoComplete="name" /></label>
          <label>Phone number<input name="phone" value={form.phone} onChange={updateForm} required maxLength="20" autoComplete="tel" /></label>
          <label className="span-two">Email address<input name="email" type="email" value={form.email} onChange={updateForm} required maxLength="150" autoComplete="email" /></label>
          <label className="span-two">Password<input name="password" type="password" value={form.password} onChange={updateForm} required minLength="8" autoComplete="new-password" /><small>At least 8 characters.</small></label>
          <label>City<input name="city" value={form.city} onChange={updateForm} required maxLength="100" /></label>
          <label>Area<input name="area" value={form.area} onChange={updateForm} required maxLength="100" /></label>
          {form.accountType === "provider" && <>
            <label className="span-two">Business / service name<input name="business_name" value={form.business_name} onChange={updateForm} required maxLength="150" /></label>
            <label className="span-two">Main service category
              <select name="service_category" value={form.service_category} onChange={updateForm} required>
                <option value="">Choose a category</option>
                <option>Electrician</option><option>Plumber</option><option>AC Technician</option>
                <option>Computer Repair</option><option>Cleaning</option><option>Appliance Repair</option><option>Other</option>
              </select>
            </label>
            <label>Service radius (km)<input name="service_radius" type="number" min="1" max="200" value={form.service_radius} onChange={updateForm} required /></label>
            <label>Estimated price range<input name="price_range" value={form.price_range} onChange={updateForm} placeholder="e.g. 500-1500 BDT" maxLength="100" /></label>
            <label className="span-two">Service description<textarea name="description" value={form.description} onChange={updateForm} rows="3" maxLength="2000" placeholder="Describe your services and experience" /></label>
          </>}
        </div>
        <button className="button button-full" disabled={loading}>{loading ? "Creating account..." : form.accountType === "provider" ? "Create provider account" : "Create customer account"}</button>
        <p className="form-bottom">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  );
}
