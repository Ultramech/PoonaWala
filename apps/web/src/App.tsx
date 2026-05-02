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
import { useSessionStore } from './store/session'

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/language" replace />} />
          <Route path="/language" element={<LanguagePicker />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/capture" element={<CaptureFlow />} />
          <Route path="/weight" element={<WeightEntry />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/result" element={<Result />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
