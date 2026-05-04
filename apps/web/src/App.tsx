import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguagePicker } from './pages/LanguagePicker'
import { Welcome } from './pages/Welcome'
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
import { Home } from './pages/Home'
import { LoanEstimator } from './pages/LoanEstimator'
import { LoanHistory } from './pages/LoanHistory'
import { Profile } from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
        <Routes>
          {/* New primary navigation */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/estimate" element={<LoanEstimator />} />
          <Route path="/history" element={<LoanHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/apply" element={<Navigate to="/consent" replace />} />

          {/* Loan application flow (unchanged) */}
          <Route path="/language" element={<LanguagePicker />} />
          <Route path="/welcome" element={<Welcome />} />
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

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
