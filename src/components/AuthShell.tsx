import { GraduationCap, Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeContext'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8
      bg-[var(--bg-page)] transition-colors duration-200">

      {/* Theme toggle top-right */}
      <div className="fixed top-4 right-4">
        <button onClick={toggle} className="theme-toggle" title="Temani o'zgartirish">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/30 mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] mt-1 text-center">{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div className="card p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
