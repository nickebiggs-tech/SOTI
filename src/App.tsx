import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeProvider'
import { AuthProvider, RequireAuth } from './auth/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './features/login/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { BrandingPage } from './features/admin/BrandingPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/admin/branding" element={<BrandingPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
