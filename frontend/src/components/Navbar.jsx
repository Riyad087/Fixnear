import { Link, NavLink, useNavigate } from "react-router-dom";
import { getUserRole } from "../services/api";

export default function Navbar({ isLoggedIn, onLogout }) {
  const navigate = useNavigate();
  const role = isLoggedIn ? getUserRole() : null;

  function logout() {
    onLogout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link className="brand" to="/" aria-label="FixNear home">
          <span className="brand-mark">F</span>
          <span>FixNear<span className="brand-dot">.</span></span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/providers">Find providers</NavLink>
          <NavLink to="/compare">Compare</NavLink>
          <NavLink to="/matching">Smart match</NavLink>
        </nav>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <Link className="nav-profile" to="/profile">My profile</Link>
              {role === "customer" && <>
                <Link className="nav-profile" to="/bookings">Bookings</Link>
                <Link className="nav-profile" to="/reviews">My reviews</Link>
                <Link className="nav-profile" to="/complaints">Complaints</Link>
              </>}
              {role === "provider" && <>
                <Link className="nav-profile" to="/provider-dashboard">Provider dashboard</Link>
                <Link className="nav-profile" to="/verification">Verification</Link>
              </>}
              {(role === "customer" || role === "provider") && <Link className="nav-profile" to="/quotes">Quotes</Link>}
              {role === "admin" && <Link className="nav-profile" to="/admin">Admin dashboard</Link>}
              <Link className="nav-profile" to="/notifications">Alerts</Link>
              <button className="button button-small button-outline" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link className="nav-login" to="/login">Log in</Link>
              <Link className="button button-small" to="/register">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
