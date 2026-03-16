import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL

export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  const headers = {
    ...options.headers,
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  return res.json()
}