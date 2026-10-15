import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Providers from "./pages/Providers";
import ProviderProfile from "./pages/ProviderProfile";
import CompareProviders from "./pages/CompareProviders";
import Profile from "./pages/Profile";
import { clearToken, getToken } from "./services/api";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()));

  function handleLogout() {
    clearToken();
    setIsLoggedIn(false);
  }

  function handleLogin() {
    setIsLoggedIn(true);
  }

  return (
    <div className="app-shell">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <main className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register onRegister={handleLogin} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/providers/:id" element={<ProviderProfile />} />
          <Route path="/compare" element={<CompareProviders />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} FixNear</span>
          <span>Find local help with confidence.</span>
        </div>
      </footer>
    </div>
  );
}
