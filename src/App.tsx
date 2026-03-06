import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeProvider'
import { AuthProvider, RequireAuth } from './auth/AuthContext'
import { DataProvider } from './data/DataProvider'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './features/login/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { DispensePage } from './features/dispense/DispensePage'
import { OTCPage } from './features/otc/OTCPage'
import { InsightsPage } from './features/insights/InsightsPage'
import { AskPage } from './features/ask/AskPage'
import { BrandingPage } from './features/admin/BrandingPage'
import { SeasonalityPage } from './features/seasonality/SeasonalityPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<DataProvider><AppLayout /></DataProvider>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dispense" element={<DispensePage />} />
                <Route path="/otc" element={<OTCPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/seasonality" element={<SeasonalityPage />} />
                <Route path="/ask" element={<AskPage />} />
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
