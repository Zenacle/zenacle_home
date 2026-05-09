import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import Home from './pages/Home'
import Energy from './pages/Energy'
import Appliances from './pages/Appliances'
import { Usage, Reports, Settings } from './pages/Placeholder'

function AuthGuard({ children }) {
  const { isLoggedIn, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <path d="M14 3L3 10v15h8v-8h6v8h8V10L14 3Z" fill="#2D7D46"/>
          </svg>
          <div className="w-5 h-5 border-2 border-green-mid border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function PublicGuard({ children }) {
  const { isLoggedIn, isLoading } = useAuth()
  if (isLoading) return null
  return isLoggedIn ? <Navigate to="/" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/welcome" element={<PublicGuard><Onboarding /></PublicGuard>} />
      <Route path="/login" element={<PublicGuard><Login /></PublicGuard>} />

      {/* Protected */}
      <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
      <Route path="/usage" element={<Navigate to="/usage/energy" replace />} />
      <Route path="/usage/energy" element={<AuthGuard><Energy /></AuthGuard>} />
      <Route path="/appliances" element={<AuthGuard><Appliances /></AuthGuard>} />
      <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
      <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
