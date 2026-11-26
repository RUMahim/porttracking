import axios from 'axios'

// In production the API is served from the same origin (/api), so no host is needed.
// In local dev the backend runs separately on port 5000.
const apiBase = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')

const api = axios.create({
  baseURL: `${apiBase}/api`,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('porttrack_user')
  if (raw) {
    try {
      const { token } = JSON.parse(raw)
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
      // ignore bad stored value
    }
  }
  return config
})

export default api

export function apiError(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong'
}
