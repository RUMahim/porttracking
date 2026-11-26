import { createContext, useContext, useMemo, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)

function loadUser() {
  try {
    const raw = localStorage.getItem('porttrack_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const save = (data) => {
    localStorage.setItem('porttrack_user', JSON.stringify(data))
    setUser(data)
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    save(data)
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    save(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('porttrack_user')
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, login, register, logout, isAdmin: user?.role === 'admin' }),
    [user]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
