import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
})

// Response interceptor for session expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected route, redirect to login
      const currentPath = window.location.pathname
      if (currentPath !== "/login" && currentPath !== "/register") {
        window.dispatchEvent(new CustomEvent("aegis:auth_expired"))
      }
    }
    return Promise.reject(error)
  }
)

export default api
