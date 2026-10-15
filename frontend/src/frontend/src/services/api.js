const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function getToken() {
  return sessionStorage.getItem("fixnear_token");
}

export function saveToken(token) {
  if (token) {
    sessionStorage.setItem("fixnear_token", token);
  }
}

export function clearToken() {
  sessionStorage.removeItem("fixnear_token");
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Cannot connect to the server. Check that the backend is running on port 5000.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status}).`);
  }

  return data;
}
