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
import BookingForm from "./pages/BookingForm";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import ProviderDashboard from "./pages/ProviderDashboard";
import MatchingResults from "./pages/MatchingResults";
import Quotes from "./pages/Quotes";
import Notifications from "./pages/Notifications";
import Reviews from "./pages/Reviews";
import ProviderVerification from "./pages/ProviderVerification";
import Complaints from "./pages/Complaints";
import AdminDashboard from "./pages/AdminDashboard";
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
          <Route path="/providers/:id/book" element={<ProtectedRoute allowedRoles={["customer"]}><BookingForm /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute allowedRoles={["customer"]}><MyBookings /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
          <Route path="/provider-dashboard" element={<ProtectedRoute allowedRoles={["provider"]}><ProviderDashboard /></ProtectedRoute>} />
          <Route path="/matching" element={<ProtectedRoute><MatchingResults /></ProtectedRoute>} />
          <Route path="/quotes" element={<ProtectedRoute allowedRoles={["customer", "provider"]}><Quotes /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute allowedRoles={["customer"]}><Reviews /></ProtectedRoute>} />
          <Route path="/compare" element={<CompareProviders />} />
          <Route path="/verification" element={<ProtectedRoute allowedRoles={["provider"]}><ProviderVerification /></ProtectedRoute>} />
          <Route path="/complaints" element={<ProtectedRoute allowedRoles={["customer"]}><Complaints /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
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
