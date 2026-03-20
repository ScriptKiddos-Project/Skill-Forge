import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { usePathwayStore } from './store/pathwayStore'
import { demoUser, demoPathway, demoSkillProfile, demoChatHistory } from './data/demoProfile'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OnboardingPage from './pages/OnboardingPage'
import AnalyzingPage from './pages/AnalyzingPage'
import DashboardPage from './pages/DashboardPage'
import PathwayPage from './pages/PathwayPage'
import TopicPage from './pages/TopicPage'
import ProgressPage from './pages/ProgressPage'
import MentorChatPage from './pages/MentorChatPage'
import NotFoundPage from './pages/NotFoundPage'

// Layout
import ProtectedRoute from './components/layout/ProtectedRoute'

function DemoLoader() {
  const { setDemo } = useAuthStore()
  const { setPathway, setSkillProfile, setChatHistory } = usePathwayStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setDemo(demoUser, demoUser.token)
      setPathway(demoPathway)
      setSkillProfile(demoSkillProfile)
      setChatHistory(demoChatHistory)
    }
  }, [])

  return null
}

function AppRoutes() {
  const { user, token, isDemo } = useAuthStore()
  const isAuthenticated = !!(user && token)

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/analyzing" element={<AnalyzingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pathway" element={<PathwayPage />} />
        <Route path="/topic/:stepId" element={<TopicPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/mentor" element={<MentorChatPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <DemoLoader />
      <AppRoutes />
    </BrowserRouter>
  )
}
