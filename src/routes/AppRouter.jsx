import { Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from '../pages/auth/AuthPage.jsx'
import HomePage from '../pages/homepage/HomePage.jsx'
import SettingsPage from '../pages/settings/SettingsPage.jsx'
import { LoginRoute, ProtectedRoute } from './ProtectedRoute.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginRoute>
            <AuthPage mode="login" />
          </LoginRoute>
        }
      />
      <Route
        path="/first-steps"
        element={
          <LoginRoute>
            <AuthPage mode="first-access" />
          </LoginRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}