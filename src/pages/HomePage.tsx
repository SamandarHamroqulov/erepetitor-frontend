import { Navigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import LandingPage from './LandingPage'

/**
 * Smart home page: shows LandingPage for guests,
 * redirects to /dashboard for logged-in users.
 */
export default function HomePage() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-page)]">
                <div className="w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (isAuthenticated) return <Navigate to="/dashboard" replace />
    return <LandingPage />
}
