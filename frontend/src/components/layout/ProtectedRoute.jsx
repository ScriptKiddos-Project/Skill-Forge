import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute() {
  const { user, token } = useAuthStore()
  const isAuthenticated = !!(user && token)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
