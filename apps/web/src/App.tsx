import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login, getUser } from './pages/Login'
import { Home } from './pages/Home'
import { LoanEstimator } from './pages/LoanEstimator'
import { Profile } from './pages/Profile'
import { LanguagePicker } from './pages/LanguagePicker'
import { Consent } from './pages/Consent'
import { OTP } from './pages/OTP'
import { Setup } from './pages/Setup'
import { CaptureFlow } from './pages/CaptureFlow'
import { WeightEntry } from './pages/WeightEntry'
import { Processing } from './pages/Processing'
import { Result } from './pages/Result'
import { Dashboard } from './pages/Dashboard'
import { DashboardDetail } from './pages/DashboardDetail'
import { FieldAgent } from './pages/FieldAgent'

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getUser() ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Main app — requires login */}
          <Route path="/" element={<Navigate to={getUser() ? '/home' : '/login'} replace />} />
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/estimate" element={<RequireAuth><LoanEstimator /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/apply" element={<Navigate to="/consent" replace />} />

          {/* Loan application flow */}
          <Route path="/language" element={<LanguagePicker />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/capture" element={<CaptureFlow />} />
          <Route path="/weight" element={<WeightEntry />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/result" element={<Result />} />

          {/* NBFC dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/session/:id" element={<DashboardDetail />} />
          <Route path="/agent" element={<FieldAgent />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
