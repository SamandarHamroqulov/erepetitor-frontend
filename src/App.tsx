import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { ThemeProvider } from './components/ThemeContext'
import { Layout } from './components/Layout'
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/Guards'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordPages'
import DashboardPage from './pages/DashboardPage'
import SchedulePage from './pages/SchedulePage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import PaymentsPage from "./pages/PaymentsPage"; import BillingPage from './pages/BillingPage'
import ProfilePage from './pages/ProfilePage'
import AdminBillingPage from './pages/AdminBillingPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import StudentHistoryPage from './pages/StudentHistoryPage'
import DebtorsPage from './pages/DebtorsPage'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/verify-otp" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
              <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

              {/* Landing / Home */}
              <Route path="/" element={<HomePage />} />

              {/* Protected */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/debtors" element={<DebtorsPage />} />
                <Route path="/students/:id/history" element={<StudentHistoryPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                <Route path="/admin/billing" element={<AdminRoute><AdminBillingPage /></AdminRoute>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
