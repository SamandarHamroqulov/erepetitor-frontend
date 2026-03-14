import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays, Users, CreditCard,
  UserCircle, GraduationCap, Moon, Sun,
  LayoutDashboard, Shield, Receipt, Users2,
} from 'lucide-react'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { OfflineBanner } from './ui/OfflineBanner'
import { useEffect } from 'react'
import { useToast } from './ui/Toast'

// Mobile: 5 ta eng muhim
const mobileNavItems = [
  { to: '/dashboard', label: 'Asosiy', icon: LayoutDashboard },
  { to: '/schedule', label: 'Jadval', icon: CalendarDays },
  { to: '/groups', label: 'Guruhlar', icon: Users },
  { to: '/students', label: "O'quvchilar", icon: Users2 },
  { to: '/payments', label: "To'lovlar", icon: CreditCard },
  { to: '/profile', label: 'Profil', icon: UserCircle },
]

const baseNavItems = [
  { to: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { to: '/schedule', label: 'Jadval', icon: CalendarDays },
  { to: '/groups', label: 'Guruhlar', icon: Users },
  { to: '/students', label: "O'quvchilar", icon: Users2 },
  { to: '/payments', label: "To'lovlar", icon: CreditCard },
  { to: '/billing', label: 'Obuna', icon: Receipt },
  { to: '/profile', label: 'Profil', icon: UserCircle },
]

export function Layout() {
  const { teacher } = useAuth()
  const navItems = teacher?.role === 'ADMIN'
    ? [...baseNavItems, { to: '/admin', label: 'Admin', icon: Shield }]
    : baseNavItems
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = () => {
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

      {/* ── Desktop Sidebar ──────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-40
        bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] transition-colors duration-200">
        <div className="px-5 py-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/20 shrink-0">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight">eRepetitor</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{teacher?.name}</p>
            </div>
            <button onClick={toggle} className="theme-toggle" title={isDark ? "Yorug'" : "Qorong'"}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          <nav className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/schedule'}
                className={({ isActive }) =>
                  ['flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/25'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-page)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-5 py-4 border-t border-[var(--border-color)]">
          <p className="text-[11px] text-[var(--text-muted)]">v1.1</p>
        </div>
      </aside>

      {/* ── Page content ────────────────────────── */}
      <main className="lg:pl-60 min-h-dvh pb-24 lg:pb-6">
        <div className="max-w-[520px] lg:max-w-none mx-auto px-4 lg:px-6 pt-4 lg:pt-6">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ───────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom
        bg-[var(--bg-nav)] border-t border-[var(--border-color)] transition-colors duration-200">
        <div className="flex items-stretch justify-around max-w-[520px] mx-auto">
          {mobileNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/schedule'}
              className={({ isActive }) =>
                ['flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 text-[10px] font-semibold transition-colors',
                  isActive ? 'text-indigo-600' : 'text-[var(--text-muted)]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={['w-10 h-6 flex items-center justify-center rounded-xl transition-all duration-150',
                    isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : '',
                  ].join(' ')}>
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 1.75} />
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
