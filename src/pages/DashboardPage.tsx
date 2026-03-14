import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, TrendingUp, BookOpen, Calendar,
  ChevronRight, CheckCircle2, XCircle, AlertCircle,
  BarChart2, ClipboardList, ArrowRight,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney, formatDate, formatMonthLabel, currentMonthISO } from '../lib/date'
import dayjs from '../lib/date'

// ── Types ─────────────────────────────────────────────────
interface DashboardData {
  month: string
  students: { total: number; active: number }
  payments: { month: string; dueCount: number; paidCount: number; dueSum: string; paidSum: string }
  groups: { total: number; active: number; cards: Array<{ id: number; name: string; activeStudents: number }> }
  today: { weekday: string; lessonCount: number; groupCount: number }
  recentPayments: Array<{
    id: number
    student: { id: number; name: string; group: { name: string } }
    amount: string; paidAmount: string; remainingAmount: string; paidAt: string | null; status: string
  }>
  debtorsPreview: Array<{
    id: number
    student: { id: number; name: string; parentPhone: string | null; group: { name: string } }
    amount: string; paidAmount: string; remainingAmount: string; remaining: string; status: string
  }>
}

interface ChartsData {
  revenueChart: Array<{ month: string; amount: number }>
  paymentStatus: Array<{ label: string; value: number; color: string }>
  groupChart: Array<{ name: string; students: number }>
  studentGrowth: Array<{ month: string; count: number }>
}

interface AttendanceReminder {
  groupId: number
  groupName: string
  startTime: string
  studentCount: number
  markedCount: number
}

// ── Helpers ───────────────────────────────────────────────
function shortMonth(m: string) { return dayjs(m).format('MMM') }
function formatK(val: number) {
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M'
  if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K'
  return String(val)
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-[var(--text-muted)] mb-1">{dayjs(label).format('MMMM YYYY')}</p>
      <p className="text-sm font-bold text-emerald-600">{formatMoney(payload[0].value)}</p>
    </div>
  )
}

function GroupTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 shadow-lg">
      <p className="text-sm font-bold text-[var(--text-primary)]">{payload[0].value} o'quvchi</p>
    </div>
  )
}

// ── Attendance Reminder Banner ────────────────────────────
function AttendanceReminderBanner({
  reminders,
  onDismiss,
}: {
  reminders: AttendanceReminder[]
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  if (reminders.length === 0) return null

  return (
    <div className="card border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
          <ClipboardList size={18} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-amber-800 dark:text-amber-400 text-sm">
            {reminders.length} ta guruhda davomat belgilanmagan
          </p>
          <p className="text-xs text-amber-700/70 dark:text-amber-500 mt-0.5 mb-3">
            Bugungi dars o'tgan guruhlar
          </p>

          <div className="space-y-2">
            {reminders.map((r) => {
              const missing = r.studentCount - r.markedCount
              const isPartial = r.markedCount > 0

              return (
                <button
                  key={r.groupId}
                  onClick={() => navigate(`/groups/${r.groupId}?tab=attendance`)}
                  className="w-full flex items-center justify-between gap-3
                    bg-white dark:bg-amber-900/20 rounded-xl px-3 py-2.5
                    border border-amber-200 dark:border-amber-800/40
                    hover:border-amber-400 dark:hover:border-amber-600
                    transition-all group text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {r.groupName}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {r.startTime} ·{' '}
                      {isPartial
                        ? `${missing} ta o'quvchi belgilanmagan`
                        : `${r.studentCount} ta o'quvchi belgilanmagan`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isPartial && (
                      <div className="w-14 h-1.5 bg-amber-100 dark:bg-amber-800/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(r.markedCount / r.studentCount) * 100}%` }}
                        />
                      </div>
                    )}
                    <ArrowRight size={15} className="text-amber-500 group-hover:text-amber-700 transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-amber-400 hover:text-amber-600 transition-colors shrink-0 mt-0.5"
          title="Yopish"
        >
          <XCircle size={18} />
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [charts, setCharts] = useState<ChartsData | null>(null)
  const [reminders, setReminders] = useState<AttendanceReminder[]>([])
  const [reminderDismissed, setReminderDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [month, setMonth] = useState(currentMonthISO())
  const toast = useToast()

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/api/dashboard/main', { params: { date: month } })
      setData(res.data)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
    } finally { setLoading(false) }
  }

  async function loadCharts() {
    setChartsLoading(true)
    try {
      const res = await api.get('/api/dashboard/charts', { params: { months: 6 } })
      setCharts(res.data)
    } catch { } finally { setChartsLoading(false) }
  }

  async function loadReminders() {
    try {
      const res = await api.get('/api/dashboard/attendance-reminder')
      setReminders(res.data.reminders || [])
    } catch { }
  }

  useEffect(() => { load() }, [month])
  useEffect(() => { loadCharts(); loadReminders() }, [])

  if (loading) return <div className="pt-2"><SkeletonList count={8} /></div>
  if (!data) return null

  const { students, payments, groups, today, recentPayments, debtorsPreview } = data
  const paidPercent = payments.dueCount + payments.paidCount > 0
    ? Math.round((payments.paidCount / (payments.dueCount + payments.paidCount)) * 100)
    : 0
  const totalDonut = charts?.paymentStatus.reduce((s, x) => s + x.value, 0) || 0

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Bosh sahifa</h1>
          <p className="page-subtitle">{formatMonthLabel(data.month)}</p>
        </div>
        <input
          type="month"
          value={month.slice(0, 7)}
          onChange={e => setMonth(e.target.value + '-01')}
          className="input-base w-auto min-w-[140px] text-sm"
        />
      </div>

      {/* ── Attendance reminder banner ──────────────── */}
      {!reminderDismissed && reminders.length > 0 && (
        <AttendanceReminderBanner
          reminders={reminders}
          onDismiss={() => setReminderDismissed(true)}
        />
      )}

      {/* ── Stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Income wide card */}
        <div className="sm:col-span-2 lg:col-span-4 card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
            <TrendingUp size={22} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--text-muted)] font-medium">Oy daromadi</p>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight">{formatMoney(payments.paidSum)}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${paidPercent}%` }} />
              </div>
              <span className="text-xs text-[var(--text-muted)] shrink-0">{paidPercent}%</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-[var(--text-muted)]">{payments.paidCount} to'lov</p>
          </div>
        </div>

        <div className="card p-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-2">
            <Users size={17} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{students.active}</p>
          <p className="text-xs text-[var(--text-muted)]">Faol o'quvchilar</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Jami: {students.total}</p>
        </div>

        <div className="card p-4">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-2">
            <AlertCircle size={17} className="text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600">{payments.dueCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Qarzdorlar</p>
          <p className="text-[11px] text-rose-400 mt-0.5">{formatMoney(payments.dueSum)}</p>
        </div>

        <div className="card p-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-2">
            <BookOpen size={17} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{groups.active}</p>
          <p className="text-xs text-[var(--text-muted)]">Faol guruhlar</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Jami: {groups.total}</p>
        </div>

        <div className="card p-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-2">
            <Calendar size={17} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{today.lessonCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Bugungi darslar</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{today.groupCount} guruh</p>
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────── */}
      {chartsLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-48 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-36" />
            <div className="skeleton h-36" />
          </div>
        </div>
      ) : charts && (
        <div className="space-y-3">
          {/* Revenue area chart */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-[var(--text-primary)] text-sm">Oylik daromad</p>
                <p className="text-xs text-[var(--text-muted)]">Oxirgi 6 oy</p>
              </div>
              <BarChart2 size={18} className="text-[var(--text-muted)]" />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={charts.revenueChart} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" tickFormatter={shortMonth} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGrad)"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut + Groups bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="font-bold text-[var(--text-primary)] text-sm mb-1">To'lov holati</p>
              <p className="text-xs text-[var(--text-muted)] mb-3">Joriy oy</p>
              {totalDonut === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-[var(--text-muted)]">Ma'lumot yo'q</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={charts.paymentStatus.filter(x => x.value > 0)} cx="50%" cy="50%"
                        innerRadius={28} outerRadius={44} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {charts.paymentStatus.filter(x => x.value > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {charts.paymentStatus.filter(x => x.value > 0).map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-[11px] text-[var(--text-secondary)]">{s.label}</span>
                        </div>
                        <span className="text-[11px] font-bold text-[var(--text-primary)]">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card p-4">
              <p className="font-bold text-[var(--text-primary)] text-sm mb-1">Guruhlar</p>
              <p className="text-xs text-[var(--text-muted)] mb-3">O'quvchilar soni</p>
              {charts.groupChart.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-[var(--text-muted)]">Guruh yo'q</div>
              ) : (
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={charts.groupChart} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<GroupTooltip />} />
                    <Bar dataKey="students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Student growth */}
          {charts.studentGrowth.some(x => x.count > 0) && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-sm">O'quvchilar o'sishi</p>
                  <p className="text-xs text-[var(--text-muted)]">Yangi qo'shilganlar</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={charts.studentGrowth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={shortMonth} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: unknown) => [`${v} o'quvchi`, '']}
                    labelFormatter={(l) => dayjs(l).format('MMMM YYYY')}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Recent payments ─────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h2 className="font-bold text-[var(--text-primary)] text-sm">So'nggi to'lovlar</h2>
          <Link to="/payments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Barchasi <ChevronRight size={13} />
          </Link>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {recentPayments.length === 0 ? (
            <div className="px-4 py-6 text-center text-[var(--text-muted)] text-sm">Bu oy hali to'lov yo'q</div>
          ) : (
            recentPayments.slice(0, 5).map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">{p.student.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{p.student.group.name}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right ml-3">
                  <p className="font-bold text-emerald-600 text-sm">{formatMoney(p.paidAmount)}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">To'landi</p>
                  {p.paidAt && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatDate(p.paidAt, 'DD MMM')}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Debtors preview ─────────────────────────── */}
      {debtorsPreview.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="font-bold text-[var(--text-primary)] text-sm">Qarzdorlar</h2>
            <Link to="/payments?filter=due" className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
              Barchasi <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {debtorsPreview.slice(0, 5).map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <XCircle size={16} className="text-rose-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">{p.student.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {p.student.group.name}
                      {p.student.parentPhone && ` · ${p.student.parentPhone}`}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right ml-3">
                  <p className="font-bold text-rose-600 text-sm">
                    {formatMoney(Number(p.remainingAmount || p.remaining || 0))}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Qoldi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
