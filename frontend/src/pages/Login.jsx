import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest, saveToken } from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const token = data.token || data.accessToken;
      if (!token) {
        throw new Error("Login response did not include a token. Check the backend response format.");
      }
      saveToken(token);
      onLogin();
      const role = data.user?.role;
      const defaultPath = role === "admin" ? "/admin" : role === "provider" ? "/provider-dashboard" : "/profile";
      navigate(location.state?.from?.pathname || defaultPath, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout auth-layout-login">
      <div className="auth-intro">
        <p className="eyebrow">Welcome back</p>
        <h1>Your local service search, all in one place.</h1>
        <p>Log in to view your account and continue exploring providers.</p>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Log in to FixNear</h2>
        <p className="muted">Enter the email and password you registered with.</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        <button className="button button-full" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
        <p className="form-bottom">New to FixNear? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  );
}
