import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import WelcomeBonusPopup from './components/WelcomeBonusPopup'
import WelcomeBonusBanner from './components/WelcomeBonusBanner'

const Landing = lazy(() => import('./pages/Landing'))
const Analyze = lazy(() => import('./pages/Analyze'))
const UploadScreen = lazy(() => import('./pages/UploadScreen'))
const PaymentReturn = lazy(() => import('./pages/PaymentReturn'))
const History = lazy(() => import('./pages/History'))
const Admin = lazy(() => import('./pages/Admin'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Support = lazy(() => import('./pages/Support'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const NotFound = lazy(() => import('./pages/NotFound'))
const SharePage = lazy(() => import('./pages/SharePage'))
const Blog = lazy(() => import('./pages/Blog'))
const Article = lazy(() => import('./pages/Article'))
const Terms = lazy(() => import('./pages/Terms'))
const About = lazy(() => import('./pages/About'))


export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <WelcomeBonusPopup />
          <WelcomeBonusBanner />
          <Suspense fallback={<div style={{ background: '#0a0a1a', minHeight: '100vh' }} />}>
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
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<Article />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}
