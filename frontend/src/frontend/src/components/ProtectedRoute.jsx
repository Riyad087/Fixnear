import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../services/api";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
