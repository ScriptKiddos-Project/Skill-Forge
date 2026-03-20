import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — inject auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// SSE helper for AnalyzingPage
export const createSSEStream = (jobId, onStage, onComplete, onError) => {
  const token = useAuthStore.getState().token
  const url = `${BASE_URL}/analyze/stream/${jobId}?token=${token}`
  const eventSource = new EventSource(url)

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      if (data.stage === 'complete') {
        eventSource.close()
        onComplete(data)
      } else {
        onStage(data)
      }
    } catch {
      onError(new Error('Failed to parse SSE event'))
    }
  }

  eventSource.onerror = () => {
    eventSource.close()
    onError(new Error('SSE connection failed'))
  }

  return () => eventSource.close()
}

export default api
