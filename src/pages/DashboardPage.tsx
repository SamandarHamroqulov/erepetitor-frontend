import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, CreditCard, TrendingUp,
  ChevronRight, CheckCircle2, XCircle, LayoutDashboard,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney, formatDate, formatMonthLabel, currentMonthISO } from '../lib/date'
import dayjs from '../lib/date'

interface DashboardData {
  month: string
  students: { total: number; active: number }
  payments: {
    month: string
    dueCount: number
    paidCount: number
    dueSum: string
    paidSum: string
  }
  groups: { total: number; active: number; cards: Array<{ id: number; name: string; activeStudents: number }> }
  today: {
    weekday: string
    lessonCount: number
    groupCount: number
  }
  recentPayments: Array<{
    id: number
    student: { id: number; name: string; group: { name: string } }
    amount: string
    paidAmount: string
    paidAt: string | null
    status: string
  }>
  debtorsPreview: Array<{
    id: number
    student: { id: number; name: string; parentPhone: string | null; group: { name: string } }
    amount: string
    remaining: string
    status: string
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonthISO())
  const toast = useToast()

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/api/dashboard/main', {
        params: { date: month },
      })
      setData(res.data)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [month])

  if (loading) return <div className="pt-4"><SkeletonList count={8} /></div>
  if (!data) return null

  const { students, payments, recentPayments, debtorsPreview } = data

  const statCards = [
    {
      label: "O'quvchilar",
      value: students.active,
      sub: `Jami: ${students.total}`,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      label: "To'langan",
      value: payments.paidCount,
      sub: formatMoney(payments.paidSum),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Qarzdorlar',
      value: payments.dueCount,
      sub: formatMoney(payments.dueSum),
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
    },
    {
      label: 'Oy daromadi',
      value: formatMoney(payments.paidSum),
      sub: payments.paidCount + ' ta to\'lov',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Bosh sahifa</h1>
          <p className="page-subtitle">{formatMonthLabel(data.month)}</p>
        </div>
        <input
          type="month"
          value={month.slice(0, 7)}
          onChange={e => setMonth(e.target.value + '-01')}
          className="input-base w-full sm:w-auto sm:min-w-[160px]"
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${bg} ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="text-xs text-[var(--text-secondary)]">{label}</p>
            {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Tables row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="font-bold text-[var(--text-primary)]">So'nggi to'lovlar</h2>
            <Link
              to="/payments"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Barchasi <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {recentPayments.length === 0 ? (
              <div className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
                Bu oy hali to'lov yo'q
              </div>
            ) : (
              recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-page)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                      {p.student.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {p.student.group.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right ml-3">
                    <p className="font-semibold text-emerald-600 text-sm">{formatMoney(p.amount)}</p>
                    {p.paidAt && (
                      <p className="text-[11px] text-[var(--text-muted)]">{formatDate(p.paidAt, 'DD MMM')}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Debtors preview */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="font-bold text-[var(--text-primary)]">Qarzdorlar</h2>
            <Link
              to="/payments?filter=due"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Barchasi <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {debtorsPreview.length === 0 ? (
              <div className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
                Qarzdor yo'q
              </div>
            ) : (
              debtorsPreview.map((p) => (
                <div
                  key={p.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-page)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                      {p.student.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {p.student.group.name}
                      {p.student.parentPhone && ` · ${p.student.parentPhone}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right ml-3">
                    <p className="font-semibold text-rose-600 text-sm">{formatMoney(p.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick link to schedule */}
      <Link
        to="/schedule"
        className="card p-4 flex items-center gap-4 hover:bg-[var(--bg-page)] transition-colors group"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
          <LayoutDashboard size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-primary)]">Darslar jadvali</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Kelayotgan darslar ro'yxati
          </p>
        </div>
        <ChevronRight size={20} className="text-[var(--text-muted)] group-hover:text-indigo-500" />
      </Link>
    </div>
  )
}
