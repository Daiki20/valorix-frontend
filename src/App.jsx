import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Landing from './pages/Landing'
import Analyze from './pages/Analyze'
import UploadScreen from './pages/UploadScreen'
import PaymentReturn from './pages/PaymentReturn'
import History from './pages/History'
import Admin from './pages/Admin'
import Privacy from './pages/Privacy'
import Support from './pages/Support'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import SharePage from './pages/SharePage'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/upload" element={<UploadScreen />} />
            <Route path="/payment-return" element={<PaymentReturn />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
