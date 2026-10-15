import { Navigate, useLocation } from "react-router-dom";
import { getToken, getUserRole } from "../services/api";

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const token = getToken();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  // This client-side check is for navigation only; the API must enforce authorization too.
  const role = getUserRole();
  if (allowedRoles?.length && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={role === "provider" ? "/provider-dashboard" : role === "admin" ? "/admin" : "/"} replace />;
  }
  return children;
}
