import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, saveToken } from "../services/api";

const initialForm = {
  name: "", email: "", phone: "", password: "", city: "", area: "",
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
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSuccess("Account created. You can now log in.");
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
        <h2>Create your account</h2>
        <p className="muted">All fields are required unless marked optional.</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}

        <div className="form-grid">
          <label>Full name<input name="name" value={form.name} onChange={updateForm} required maxLength="100" autoComplete="name" /></label>
          <label>Phone number<input name="phone" value={form.phone} onChange={updateForm} required maxLength="20" autoComplete="tel" /></label>
          <label className="span-two">Email address<input name="email" type="email" value={form.email} onChange={updateForm} required maxLength="150" autoComplete="email" /></label>
          <label className="span-two">Password<input name="password" type="password" value={form.password} onChange={updateForm} required minLength="8" autoComplete="new-password" /><small>At least 8 characters.</small></label>
          <label>City<input name="city" value={form.city} onChange={updateForm} required maxLength="100" /></label>
          <label>Area<input name="area" value={form.area} onChange={updateForm} required maxLength="100" /></label>
        </div>
        <button className="button button-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
        <p className="form-bottom">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  );
}
