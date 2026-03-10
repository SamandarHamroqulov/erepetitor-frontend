import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays, Users, CreditCard, Receipt,
  UserCircle, GraduationCap, Moon, Sun, LayoutDashboard, Shield,
} from 'lucide-react'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { OfflineBanner } from './ui/OfflineBanner'
import { useEffect } from 'react'
import { useToast } from './ui/Toast'

const baseNavItems = [
  { to: '/',         label: 'Bosh sahifa', icon: LayoutDashboard },
  { to: '/schedule', label: 'Jadval',     icon: CalendarDays },
  { to: '/groups',   label: 'Guruhlar',  icon: Users },
  { to: '/payments', label: "To'lovlar", icon: CreditCard },
  { to: '/billing',  label: 'Obuna',     icon: Receipt },
  { to: '/profile',  label: 'Profil',    icon: UserCircle },
]

export function Layout() {
  const { teacher } = useAuth()
  const navItems = teacher?.role === 'ADMIN'
    ? [...baseNavItems, { to: '/admin/billing', label: 'Admin', icon: Shield }]
    : baseNavItems
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = () => {
      // Keep UX simple: route user to billing when subscription is expired
      if (location.pathname !== '/billing') {
        toast.warning("Obuna muddati tugagan. To'lov qiling.")
        navigate('/billing')
      }
    }
    window.addEventListener('subscription:expired', handler)
    return () => window.removeEventListener('subscription:expired', handler)
  }, [location.pathname, navigate, toast])

  return (
    <div className="min-h-dvh bg-[var(--bg-page)] transition-colors duration-200">
      <OfflineBanner />

      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-40
        bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] transition-colors duration-200">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/20 shrink-0">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)]">eRepetitor</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{teacher?.name}</p>
            </div>
            {/* Theme toggle */}
            <button onClick={toggle} className="theme-toggle" title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' ? true : to === '/schedule'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-page)] hover:text-[var(--text-primary)]',
                ].join(' ')
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-muted)] text-center">eRepetitor v1.0</p>
        </div>
      </aside>

      {/* ── Page content ─────────────────────────────────── */}
      <main className="lg:pl-64 min-h-dvh pb-24 lg:pb-6">
        <div className="max-w-[480px] lg:max-w-none mx-auto px-4 lg:px-6 pt-4 lg:pt-6">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom
        bg-[var(--bg-nav)] border-t border-[var(--border-color)] transition-colors duration-200">
        <div className="flex items-stretch justify-around max-w-[480px] mx-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' ? true : to === '/schedule'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-indigo-500' : 'text-[var(--text-muted)]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={[
                    'w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-150',
                    isActive ? (isDark ? 'bg-indigo-900/50' : 'bg-indigo-50') : '',
                  ].join(' ')}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
