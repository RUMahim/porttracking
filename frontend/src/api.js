import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
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
