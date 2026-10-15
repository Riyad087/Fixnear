import { Link, NavLink, useNavigate } from "react-router-dom";

export default function Navbar({ isLoggedIn, onLogout }) {
  const navigate = useNavigate();

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
        </nav>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <Link className="nav-profile" to="/profile">My profile</Link>
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
