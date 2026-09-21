import { Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from '../pages/auth/AuthPage.jsx'
import HomePage from '../pages/homepage/HomePage.jsx'
import { LoginRoute, ProtectedRoute } from './ProtectedRoute.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginRoute>
            <AuthPage />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}