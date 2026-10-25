import React, { createContext, useContext, useState, useEffect } from "react"
import api from "../api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function checkAuth() {
    try {
      const res = await api.get("/auth/me")
      setUser(res.data.user)
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()

    function handleAuthExpired() {
      setUser(null)
    }

    window.addEventListener("aegis:auth_expired", handleAuthExpired)
    return () => window.removeEventListener("aegis:auth_expired", handleAuthExpired)
  }, [])

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password })
    setUser(res.data.user)
    return res.data.user
  }

  async function register(name, email, password) {
    const res = await api.post("/auth/register", { name, email, password })
    setUser(res.data.user)
    return res.data.user
  }

  async function logout() {
    try {
      await api.post("/auth/logout")
    } catch (err) {
      // Ignore logout errors
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
