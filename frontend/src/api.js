// frontend/src/api.js
// Uses VITE_API_URL in production, falls back to localhost in dev

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

import { supabase } from "./supabase";

export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }

  // Handle empty responses (204 No Content)
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}