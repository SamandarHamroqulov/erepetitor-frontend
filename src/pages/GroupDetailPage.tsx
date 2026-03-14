import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Plus, CheckCircle2, XCircle, UserPlus,
  Phone, MoreVertical, CreditCard, BookOpen, Users, Save,
  CalendarDays, TrendingDown, AlertTriangle, BarChart2,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useMemo } from 'react'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney, currentMonthISO } from '../lib/date'
import dayjs from '../lib/date'
import type {
  Group, StudentWithPayment, PaymentsSummary,
  AttendanceRecord, AttendanceStatus, Payment,
} from '../types'

// ─── Types ────────────────────────────────────────────────
interface GroupDetailData {
  month: string
  group: Group
  schedule: Array<{ id: number; weekday: string; startTime: string; durationMin: number }>
  students: StudentWithPayment[]
  paymentsSummary: PaymentsSummary
}

interface StudentAttendanceStat {
  studentId: number
  name: string
  parentPhone: string | null
  present: number
  absent: number
  late: number
  totalLessons: number
  attended: number
  attendanceRate: number | null
  lowAttendance: boolean
  dates: Array<{ date: string; status: string }>
}

interface MonthlyStatsData {
  month: string
  totalLessons: number
  uniqueDates: string[]
  summary: { present: number; absent: number; late: number; total: number }
  students: StudentAttendanceStat[]
}

// ─── Status badge ─────────────────────────────────────────
function AttendanceBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-xs text-[var(--text-muted)]">—</span>
  const color = rate >= 80 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
    : rate >= 60 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
      : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {rate}%
    </span>
  )
}

// ─── Student row (payments) ───────────────────────────────
// ─── Student row (payments) ───────────────────────────────
function StudentRow({
  student, selected, onSelect, onPay, onUnpay, onDelete, onEdit, groupPrice
}: {
  student: StudentWithPayment
  selected?: boolean
  onSelect?: (s: StudentWithPayment) => void
  onPay: (s: StudentWithPayment, p: NonNullable<StudentWithPayment['paymentThisMonth']> | null) => void
  onUnpay: (s: StudentWithPayment) => void
  onDelete: (s: StudentWithPayment) => void
  onEdit: (s: StudentWithPayment) => void
  groupPrice: string
}) {
  const p = student.paymentThisMonth
  const [menuOpen, setMenuOpen] = useState(false)

  const isCustomFee = student.customMonthlyFee !== null && student.customMonthlyFee !== undefined
  const currentFee = isCustomFee ? String(student.customMonthlyFee) : groupPrice

  return (
    <div className={['flex items-center gap-3 px-4 py-2.5 transition-colors', !student.isActive ? 'opacity-50' : ''].join(' ')}>
      {onSelect && (
        <div className="shrink-0 flex items-center pr-1">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onSelect(student)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
          />
        </div>
      )}
      <div className="w-8 h-8 rounded-full bg-[var(--bg-page)] flex items-center justify-center shrink-0 text-sm font-bold text-[var(--text-secondary)]">
        {student.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-medium text-[var(--text-primary)] text-sm truncate">{student.name}</p>
          {!student.isActive && (
            <span className="text-[10px] bg-[var(--bg-page)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-full font-medium shrink-0">Nofaol</span>
          )}
          <span className={['text-[10px] px-2 py-0.5 rounded-full font-bold transition-all',
            isCustomFee ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-50 text-gray-500 dark:bg-gray-800'
          ].join(' ')}>
            {formatMoney(currentFee, '')} {isCustomFee ? '(Maxsus)' : '(Guruh)'}
          </span>
        </div>
        {student.parentPhone && (
          <a href={`tel:${student.parentPhone}`} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-indigo-600 transition-colors mt-0.5">
            <Phone size={10} />{student.parentPhone}
          </a>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-4">
        {p ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-[10px] leading-tight text-[var(--text-muted)]">
              <div className="flex justify-between w-24"><span>Jami:</span><span className="font-medium text-[var(--text-primary)]">{formatMoney(p.amount, '')}</span></div>
              <div className="flex justify-between w-24"><span>To'landi:</span><span className="font-medium text-emerald-600">{formatMoney(p.paidAmount, '')}</span></div>
              <div className="flex justify-between w-24 border-t border-gray-100 dark:border-gray-800 mt-0.5 pt-0.5 font-bold">
                <span>Qoldi:</span>
                <span className={Number(p.amount) - Number(p.paidAmount) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {formatMoney(Number(p.amount) - Number(p.paidAmount), '')}
                </span>
              </div>
            </div>

            {p.status === 'PAID' ? (
              <button onClick={() => onUnpay(student)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-all shadow-sm">
                <CheckCircle2 size={14} />To'liq
              </button>
            ) : p.status === 'PARTIAL' ? (
              <button onClick={() => onPay(student, p)}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl hover:bg-amber-100 transition-all shadow-sm">
                <TrendingDown size={14} />Qisman
              </button>
            ) : (
              <button onClick={() => onPay(student, p)}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl hover:bg-rose-100 transition-all shadow-sm">
                <CreditCard size={14} />To'lash
              </button>
            )
            }
          </div>
        ) : (
          <span className="text-xs text-[var(--text-muted)] px-3 py-2">—</span>
        )}
      </div>

      <div className="relative">
        <button onClick={() => setMenuOpen(m => !m)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-page)] transition-colors">
          <MoreVertical size={15} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[170px]">
            <button className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-page)]"
              onClick={() => { onEdit(student); setMenuOpen(false) }}>Tahrirlash (Narx, Tel)</button>
            {p && (
              <button className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-page)]"
                onClick={() => { onPay(student, p); setMenuOpen(false) }}>To'lov summasini o'zgartirish</button>
            )}
            <div className="h-px bg-[var(--border-color)] my-1" />
            <button className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
              onClick={() => { onDelete(student); setMenuOpen(false) }}>Guruhdan chiqarish</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pay modal ────────────────────────────────────────────
// ─── Pay modal ────────────────────────────────────────────
function PayModal({ payment, studentName, open, onClose, onPaid }: {
  payment: NonNullable<StudentWithPayment['paymentThisMonth']> | null
  studentName?: string; open: boolean; onClose: () => void; onPaid: (updated: any, newPersistentFee?: number) => void
}) {
  const [mode, setMode] = useState<'pay' | 'edit'>('pay')
  const [amount, setAmount] = useState('')
  const [saveAsPersistent, setSaveAsPersistent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (open && payment) {
      setMode('pay')
      setAmount(String(Number(payment.amount) - Number(payment.paidAmount || 0)))
      setSaveAsPersistent(false)
      setError('')
    }
  }, [open, payment])

  async function handleAction() {
    if (!payment) return
    const val = Number(amount.replace(/[\s,]/g, ''))

    if (mode === 'pay') {
      const remaining = Number(payment.amount) - Number(payment.paidAmount || 0)
      if (!val || val <= 0) { setError('Summa kiriting'); return }
      if (val > remaining) { setError(`Maksimal: ${formatMoney(remaining, '')}`); return }

      setLoading(true)
      try {
        const res = await api.patch(`/api/payments/${payment.id}/pay`, { payAmount: val })
        toast.success("To'lov qabul qilindi!")
        onPaid(res.data.payment)
        onClose()
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message || 'Xatolik')
      } finally { setLoading(false) }
    } else {
      const paid = Number(payment.paidAmount || 0)
      if (!Number.isFinite(val) || val < 0) { setError('Summani kiriting'); return }
      if (val < paid) { setError(`To'langan miqdordan (${formatMoney(paid, '')}) kam bo'lishi mumkin emas`); return }

      setLoading(true)
      try {
        // 1. Update current payment row
        const res = await api.patch(`/api/payments/${payment.id}/amount`, { amount: val })

        // 2. If persistent checked, update student master fee
        if (saveAsPersistent) {
          await api.patch(`/api/students/${payment.studentId}`, { customMonthlyFee: val })
        }

        toast.success(saveAsPersistent ? "To'lov va doimiy narx yangilandi!" : "To'lov summasi yangilandi!")

        // We pass val as customMonthlyFee update hint if persistent was used
        onPaid(res.data.payment, saveAsPersistent ? val : undefined)
        onClose()
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message || 'Xatolik')
      } finally { setLoading(false) }
    }
  }

  if (!payment) return null
  const total = Number(payment.amount)
  const paid = Number(payment.paidAmount || 0)
  const remaining = total - paid
  const statusLabels: Record<string, string> = { PAID: "TO'LANGAN", PARTIAL: "QISMAN", DUE: "TO'LANMAGAN" }
  const statusColors: Record<string, string> = { PAID: "text-emerald-600", PARTIAL: "text-amber-600", DUE: "text-rose-600" }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'pay' ? "To'lov qabul qilish" : "To'lov summasini tahrirlash"} size="sm">
      <div className="space-y-4">
        {/* Toggle Modes */}
        <div className="flex bg-[var(--bg-page)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            onClick={() => { setMode('pay'); setAmount(String(remaining)); setError('') }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'pay' ? 'bg-white dark:bg-[var(--bg-card)] text-indigo-600 shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            Pul olish
          </button>
          <button
            onClick={() => { setMode('edit'); setAmount(String(total)); setError('') }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'edit' ? 'bg-white dark:bg-[var(--bg-card)] text-indigo-600 shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            Narxni o'zgartirish
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-[var(--bg-page)] rounded-2xl p-4 border border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-1">
            <p className="font-extrabold text-[var(--text-primary)] text-base">{studentName}</p>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white dark:bg-[var(--bg-card)] border border-[var(--border-color)] ${statusColors[payment.status] || ''}`}>
              {statusLabels[payment.status] || payment.status}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Jami summa:</span>
              <span className="font-bold text-[var(--text-primary)]">{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">To'langan miqdor:</span>
              <span className="font-bold text-emerald-600">{formatMoney(paid)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1.5 border-t border-[var(--border-color)] font-bold">
              <span className="text-[var(--text-secondary)]">Qolgan qarz:</span>
              <span className={remaining > 0 ? "text-rose-600" : "text-emerald-600"}>
                {formatMoney(remaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-3">
          <Input
            label={mode === 'pay' ? "Olinayotgan summa (so'm)" : "Yangi narx (faqat shu oy uchun)"}
            type="text"
            value={amount}
            onChange={e => { setAmount(e.target.value); setError('') }}
            error={error}
            autoFocus
            className="font-bold text-lg"
          />

          {mode === 'pay' && remaining > 0 && (
            <button
              onClick={() => setAmount(String(remaining))}
              className="w-full py-2 text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
            >
              Qarzni to'liq yopish: {formatMoney(remaining)}
            </button>
          )}

          {mode === 'edit' && (
            <div className="space-y-3 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-800">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={saveAsPersistent}
                  onChange={e => setSaveAsPersistent(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tight">Kelajak uchun doimiy qilish</p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                    Agar belgilansa, o'quvchining <strong>keyingi oylar</strong> uchun ham narxi shunday bo'ladi.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>Bekor qilish</Button>
          <Button fullWidth loading={loading} onClick={handleAction}>
            {mode === 'pay' ? "To'lovni saqlash" : "Narxni yangilash"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main component ───────────────────────────────────────
export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [data, setData] = useState<GroupDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonthISO())
  const [activeTab, setActiveTab] = useState<'students' | 'payments' | 'attendance'>('students')

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [localAttendance, setLocalAttendance] = useState<Record<number, AttendanceStatus>>({})
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [attendanceDirty, setAttendanceDirty] = useState(false)

  // Monthly stats state
  const [statsMonth, setStatsMonth] = useState(dayjs().format('YYYY-MM'))
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatsData | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Student actions
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newPaymentStartDate, setNewPaymentStartDate] = useState('')
  const [newCustomMonthlyFee, setNewCustomMonthlyFee] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)
  const [nameError, setNameError] = useState('')
  const [deleteStudent, setDeleteStudent] = useState<StudentWithPayment | null>(null)
  const [editStudent, setEditStudent] = useState<StudentWithPayment | null>(null)
  const [editStudentName, setEditStudentName] = useState('')
  const [editStudentPhone, setEditStudentPhone] = useState('')
  const [editStudentPaymentStartDate, setEditStudentPaymentStartDate] = useState('')
  const [editStudentCustomMonthlyFee, setEditStudentCustomMonthlyFee] = useState('')
  const [editStudentGroupId, setEditStudentGroupId] = useState('')
  const [allGroups, setAllGroups] = useState<Group[]>([])

  // Bulk actions
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
  const [showBulkActionModal, setShowBulkActionModal] = useState<'move' | 'message' | 'archive' | 'payment' | null>(null)
  const [bulkMessageText, setBulkMessageText] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Excel import
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number, skipped: number, errors: { row: number, reason: string }[] } | null>(null)
  const activeStudentsList = useMemo(() => data?.students ? data.students.filter(s => s.isActive) : [], [data?.students])

  const handleSelectStudent = (s: StudentWithPayment) => {
    setSelectedStudents(prev => {
      const next = new Set(prev)
      if (next.has(s.id)) next.delete(s.id)
      else next.add(s.id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedStudents.size === activeStudentsList.length && activeStudentsList.length > 0) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(activeStudentsList.map(s => s.id)))
    }
  }

  // Payment
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<NonNullable<StudentWithPayment['paymentThisMonth']> | null>(null)
  const [payStudentName, setPayStudentName] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMonth, setPaymentMonth] = useState(dayjs().format('YYYY-MM'))
  const [paymentStartDate, setPaymentStartDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [creatingPayments, setCreatingPayments] = useState(false)

  // Group edit
  const [showEditGroup, setShowEditGroup] = useState(false)
  const [showBulkRemove, setShowBulkRemove] = useState(false)
  const [showBulkMove, setShowBulkMove] = useState(false)
  const [targetGroupId, setTargetGroupId] = useState('')
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editSubject, setEditSubject] = useState('')

  async function load(dateStr = month) {
    try {
      const res = await api.get(`/api/groups/${id}/overview`, { params: { month: dateStr.slice(0, 7) } })
      setData(res.data)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
      navigate('/groups')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    api.get('/api/groups').then(r => setAllGroups(r.data.groups || [])).catch(() => { })
  }, [id])

  // Load single-day attendance
  const loadAttendance = useCallback(async () => {
    if (!data) return
    setAttendanceLoading(true)
    try {
      const res = await api.get(`/api/groups/${id}/attendance`, { params: { date: attendanceDate } })
      const records: AttendanceRecord[] = res.data.attendance || []
      const map: Record<number, AttendanceStatus> = {}
      for (const s of data.students.filter(s => s.isActive)) map[s.id] = 'PRESENT'
      for (const r of records) map[r.studentId] = r.status
      setLocalAttendance(map)
      setAttendanceDirty(false)
    } catch {
      if (data) {
        const map: Record<number, AttendanceStatus> = {}
        for (const s of data.students.filter(s => s.isActive)) map[s.id] = 'PRESENT'
        setLocalAttendance(map)
      }
    } finally { setAttendanceLoading(false) }
  }, [id, attendanceDate, data])

  useEffect(() => {
    if (activeTab === 'attendance' && data) loadAttendance()
  }, [id, activeTab, attendanceDate, data])

  // Load monthly stats
  async function loadMonthlyStats() {
    setStatsLoading(true)
    try {
      const res = await api.get(`/api/groups/${id}/attendance/monthly-stats`, { params: { month: statsMonth } })
      setMonthlyStats(res.data)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
    } finally { setStatsLoading(false) }
  }

  useEffect(() => {
    if (showStats) loadMonthlyStats()
  }, [showStats, statsMonth])

  async function saveAttendance() {
    setAttendanceSaving(true)
    try {
      const records = Object.entries(localAttendance).map(([sid, status]) => ({ studentId: Number(sid), status }))
      await api.put(`/api/groups/${id}/attendance`, { date: attendanceDate, records })
      toast.success('Davomat saqlandi!')
      setAttendanceDirty(false)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setAttendanceSaving(false) }
  }

  async function handleAddStudent(ev: React.FormEvent) {
    ev.preventDefault()
    if (!newName.trim()) { setNameError('Ism kiritng'); return }
    setNameError(''); setAddingStudent(true)
    try {
      await api.post('/api/students', {
        name: newName.trim(), parentPhone: newPhone.trim() || null,
        paymentStartDate: newPaymentStartDate || null,
        customMonthlyFee: newCustomMonthlyFee ? Number(newCustomMonthlyFee) : null,
        groupId: Number(id),
      })
      toast.success("O'quvchi qo'shildi!")
      setNewName(''); setNewPhone(''); setNewPaymentStartDate(''); setNewCustomMonthlyFee('')
      setShowAddStudent(false); await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setAddingStudent(false) }
  }

  async function handleDeleteStudent(s: StudentWithPayment) {
    try {
      await api.delete(`/api/students/${s.id}`)
      toast.success("O'quvchi guruhdan chiqarildi")
      setDeleteStudent(null); await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function handleEditStudentSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!editStudent) return
    try {
      const sanitizedFee = editStudentCustomMonthlyFee.replace(/[\s,]/g, '')
      await api.patch(`/api/students/${editStudent.id}`, {
        name: editStudentName.trim(),
        parentPhone: editStudentPhone.trim() || null,
        paymentStartDate: editStudentPaymentStartDate || null,
        customMonthlyFee: sanitizedFee === "" ? null : Number(sanitizedFee),
      })
      if (editStudentGroupId && editStudentGroupId !== String(id)) {
        await api.patch(`/api/students/${editStudent.id}/transfer`, { groupId: Number(editStudentGroupId) })
        toast.success("O'quvchi tahrirlandi va ko'chirildi!")
      } else {
        toast.success("O'quvchi tahrirlandi!")
      }
      setEditStudent(null); await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function handleUnpay(student: StudentWithPayment) {
    const p = student.paymentThisMonth
    if (!p) return
    try {
      const res = await api.patch(`/api/payments/${p.id}/unpay`)
      toast.info("To'lov qaytarildi")

      const updatedPayment = res.data.payment
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          students: prev.students.map(s => {
            if (s.id === student.id) {
              return { ...s, paymentThisMonth: { ...s.paymentThisMonth, ...updatedPayment } }
            }
            return s
          })
        }
      })
      load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function createMonthPayments() {
    setCreatingPayments(true)
    try {
      const res = await api.post('/api/payments/create-month', {
        groupId: Number(id), date: paymentStartDate || (paymentMonth + '-01'),
      })
      toast.success(res.data?.message || "To'lovlar yaratildi")
      setShowPaymentModal(false)
      const newMonth = paymentMonth + '-01'
      setMonth(newMonth); await load(newMonth)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setCreatingPayments(false) }
  }

  async function handleBulkRemove() {
    try {
      await api.post(`/api/groups/${id}/students/remove`)
      toast.success("Barcha o'quvchilar chiqarildi")
      setShowBulkRemove(false); await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function handleBulkMove() {
    if (!targetGroupId) return toast.error("Guruhni tanlang")
    setBulkLoading(true)
    try {
      if (selectedStudents.size > 0) {
        // Feature 1: Move selected
        const promises = Array.from(selectedStudents).map(id => api.patch(`/api/students/${id}/transfer`, { groupId: Number(targetGroupId) }))
        await Promise.allSettled(promises)
        toast.success(`${selectedStudents.size} ta o'quvchi ko'chirildi`)
        setSelectedStudents(new Set())
        setShowBulkActionModal(null)
      } else {
        // Old feature: move all
        await api.post(`/api/groups/${id}/students/move`, { targetGroupId: Number(targetGroupId) })
        toast.success("O'quvchilar ko'chirildi")
        setShowBulkMove(false)
      }
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setBulkLoading(false) }
  }

  async function executeBulkArchive() {
    setBulkLoading(true)
    try {
      const promises = Array.from(selectedStudents).map(sid => api.post(`/api/students/${sid}/archive`))
      await Promise.allSettled(promises)
      toast.success(`${selectedStudents.size} ta o'quvchi arxivlandi`)
      setSelectedStudents(new Set())
      setShowBulkActionModal(null)
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setBulkLoading(false) }
  }

  async function executeBulkMessage() {
    if (!bulkMessageText.trim()) return toast.error('Xabar matnini kiriting')
    setBulkLoading(true)
    try {
      // Need backend support for sending messages
      const promises = Array.from(selectedStudents).map(sid => api.post(`/api/students/${sid}/message`, { message: bulkMessageText }))
      const results = await Promise.allSettled(promises)
      const successCount = results.filter(r => r.status === 'fulfilled').length
      toast.success(`${successCount} ta xabar yuborildi`)
      setSelectedStudents(new Set())
      setShowBulkActionModal(null)
      setBulkMessageText('')
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setBulkLoading(false) }
  }

  async function executeBulkCreatePayment() {
    setBulkLoading(true)
    try {
      const monthStr = paymentStartDate || (paymentMonth + '-01')
      const promises = Array.from(selectedStudents).map(sid => api.post(`/api/payments`, { studentId: sid, date: monthStr }))
      await Promise.allSettled(promises)
      toast.success(`${selectedStudents.size} ta to'lov yaratildi`)
      setSelectedStudents(new Set())
      setShowBulkActionModal(null)
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setBulkLoading(false) }
  }

  async function handleEditGroup(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.put(`/api/groups/${id}`, { name: editName, monthlyPrice: editPrice, time: editTime || undefined, subject: editSubject || undefined })
      toast.success("Guruh yangilandi")
      setShowEditGroup(false); await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  // Excel Import Handlers
  async function handlePreviewImport(e: React.FormEvent) {
    e.preventDefault()
    if (!importFile) return toast.error("Fayl tanlang")
    setImportLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', importFile)
      const res = await api.post(`/api/groups/${id}/students/import-preview`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImportPreview(res.data.students || [])
      toast.success("Fayl o'qildi")
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Xatolik")
    } finally { setImportLoading(false) }
  }

  async function handleConfirmImport() {
    if (!importPreview.length) return
    setImportLoading(true)
    try {
      const res = await api.post(`/api/groups/${id}/students/import-bulk`, { students: importPreview })
      setImportResult(res.data)
      toast.success("Import yakunlandi")
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Xatolik")
    } finally { setImportLoading(false) }
  }

  // ── Reactive payments summary (MUST be before any early returns — React hooks rule) ──
  const groupStudents = data?.students || []
  const ps = useMemo(() => {
    const payments = groupStudents
      .map(s => s.paymentThisMonth)
      .filter((p): p is NonNullable<typeof p> => !!p)

    const paidItems = payments.filter(p => p.status === 'PAID')
    const dueItems = payments.filter(p => p.status === 'DUE' || p.status === 'PARTIAL')

    return {
      counts: {
        paid: paidItems.length,
        due: dueItems.length,
        total: payments.length
      },
      sums: {
        paid: payments.reduce((acc, p) => acc + Number(p.paidAmount || 0), 0).toString(),
        due: payments.reduce((acc, p) => acc + Math.max(0, Number(p.amount) - Number(p.paidAmount || 0)), 0).toString()
      }
    }
  }, [groupStudents])

  const paidCount = ps.counts.paid
  const dueCount = ps.counts.due

  if (loading) return <div className="pt-8"><SkeletonList count={5} /></div>
  if (!data) return null

  const { group } = data

  const TABS = [
    { key: 'students', label: "O'quvchilar" },
    { key: 'attendance', label: 'Davomat' },
    { key: 'payments', label: "To'lovlar" },
  ] as const

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/groups')}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">{group.name}</h1>
          {group.subject && <p className="text-sm text-[var(--text-muted)]">{group.subject}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setEditName(group.name); setEditPrice(String(group.monthlyPrice)); setEditTime(group.time || ''); setEditSubject(group.subject || ''); setShowEditGroup(true) }}>
          Tahrirlash
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-[var(--text-primary)]">{activeStudentsList.length}</p>
          <p className="text-[11px] text-[var(--text-muted)]">O'quvchi</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{paidCount}</p>
          <p className="text-[11px] text-[var(--text-muted)]">To'lagan</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-rose-600">{dueCount}</p>
          <p className="text-[11px] text-[var(--text-muted)]">Qarzdor</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        {TABS.map(t => (
          <button key={t.key}
            className={['pb-2.5 px-4 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {t.key === 'payments' && dueCount > 0 && (
              <span className="ml-1.5 bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{dueCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── O'quvchilar tab ──────────────────────────── */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--text-secondary)]">{groupStudents.length} ta o'quvchi</p>
            <div className="flex gap-2">
              {groupStudents.length > 0 && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => setShowBulkMove(true)}>Ko'chirish</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowBulkRemove(true)}>Tozalash</Button>
                </>
              )}
              <Button size="sm" variant="secondary" onClick={() => setShowImportModal(true)}>Excel import</Button>
              <Button size="sm" leftIcon={<UserPlus size={14} />} onClick={() => setShowAddStudent(true)}>Qo'shish</Button>
            </div>
          </div>

          {selectedStudents.size > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                {selectedStudents.size} ta tanlandi
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setShowBulkActionModal('move')}>Ko'chirish</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowBulkActionModal('archive')}>Arxivlash</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowBulkActionModal('message')}>Xabar</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowBulkActionModal('payment')}>To'lov</Button>
                <Button size="sm" variant="secondary" onClick={handleSelectAll} className="text-indigo-600 border-indigo-200 bg-white">Barchasi</Button>
                <Button size="sm" variant="secondary" onClick={() => setSelectedStudents(new Set())} className="text-rose-600">Bekor</Button>
              </div>
            </div>
          )}

          {groupStudents.length === 0 ? (
            <div className="card text-center py-12">
              <Users size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] text-sm mb-3">Guruhda o'quvchi yo'q</p>
              <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowAddStudent(true)}>O'quvchi qo'shish</Button>
            </div>
          ) : (
            <div className="card divide-y divide-[var(--border-color)]">
              {(groupStudents || []).map(s => (
                <StudentRow key={s.id} student={s}
                  groupPrice={data?.group.monthlyPrice || '0'}
                  selected={selectedStudents.has(s.id)}
                  onSelect={handleSelectStudent}
                  onPay={(st, p) => { setPayTarget(p); setPayStudentName(st.name); setPayModalOpen(true) }}
                  onUnpay={handleUnpay}
                  onDelete={s => setDeleteStudent(s)}
                  onEdit={s => { setEditStudent(s); setEditStudentName(s.name); setEditStudentPhone(s.parentPhone || ''); setEditStudentPaymentStartDate(s.paymentStartDate ? s.paymentStartDate.slice(0, 10) : ''); setEditStudentCustomMonthlyFee(s.customMonthlyFee ? String(s.customMonthlyFee) : ''); setEditStudentGroupId(String(id)) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Davomat tab ──────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">

          {/* Toggle: kunlik / oylik */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(false)}
              className={['flex-1 py-2 rounded-xl text-sm font-semibold border transition-all',
                !showStats ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)]',
              ].join(' ')}
            >
              <CalendarDays size={14} className="inline mr-1.5 -mt-0.5" />
              Kunlik belgilash
            </button>
            <button
              onClick={() => setShowStats(true)}
              className={['flex-1 py-2 rounded-xl text-sm font-semibold border transition-all',
                showStats ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)]',
              ].join(' ')}
            >
              <BarChart2 size={14} className="inline mr-1.5 -mt-0.5" />
              Oylik statistika
            </button>
          </div>

          {/* ── Kunlik belgilash ──────────────────────── */}
          {!showStats && (
            <>
              <div className="card p-3 flex items-center gap-3">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="input-base flex-1"
                  disabled={attendanceSaving}
                />
                {attendanceDirty && (
                  <span className="text-xs text-amber-600 font-semibold shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block" />
                    Saqlanmagan
                  </span>
                )}
              </div>

              <div className="card">
                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[var(--text-muted)]">Yuklanmoqda...</span>
                  </div>
                ) : activeStudentsList.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-8">Guruhda faol o'quvchi yo'q</p>
                ) : (
                  <div className="divide-y divide-[var(--border-color)]">
                    {activeStudentsList.map(s => {
                      const status = localAttendance[s.id] || 'PRESENT'
                      return (
                        <div key={s.id}
                          className={['flex items-center justify-between gap-3 px-4 py-3',
                            attendanceSaving ? 'opacity-50 pointer-events-none' : '',
                          ].join(' ')}
                        >
                          <p className={['font-medium text-sm flex-1 truncate transition-colors',
                            status === 'ABSENT' ? 'text-[var(--text-muted)] line-through decoration-rose-300' : 'text-[var(--text-primary)]',
                          ].join(' ')}>
                            {s.name}
                          </p>

                          <div className="flex items-center gap-1 bg-[var(--bg-page)] p-1 rounded-lg shrink-0">
                            {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map(st => {
                              const labels: Record<AttendanceStatus, string> = { PRESENT: 'Bor', LATE: 'Kechikdi', ABSENT: "Yo'q" }
                              const colors: Record<AttendanceStatus, string> = {
                                PRESENT: 'bg-indigo-600 text-white',
                                LATE: 'bg-amber-500 text-white',
                                ABSENT: 'bg-rose-500 text-white',
                              }
                              return (
                                <button key={st}
                                  onClick={() => { setAttendanceDirty(true); setLocalAttendance(p => ({ ...p, [s.id]: st })) }}
                                  className={['px-3 py-1.5 text-xs font-bold rounded-md transition-all',
                                    status === st ? colors[st] : 'text-[var(--text-muted)] hover:bg-[var(--border-color)]',
                                  ].join(' ')}
                                >
                                  {labels[st]}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {activeStudentsList.length > 0 && !attendanceLoading && (
                  <div className="px-4 py-3 border-t border-[var(--border-color)]">
                    <Button fullWidth leftIcon={<Save size={15} />} onClick={saveAttendance}
                      loading={attendanceSaving} disabled={!attendanceDirty && !Object.keys(localAttendance).length}>
                      Davomatni saqlash
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Oylik statistika ─────────────────────── */}
          {showStats && (
            <div className="space-y-4">
              <div className="card p-3">
                <input
                  type="month"
                  value={statsMonth}
                  onChange={e => setStatsMonth(e.target.value)}
                  className="input-base w-full"
                />
              </div>

              {statsLoading ? (
                <SkeletonList count={4} />
              ) : !monthlyStats ? null : monthlyStats.totalLessons === 0 ? (
                <div className="card text-center py-12">
                  <CalendarDays size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-[var(--text-secondary)] text-sm font-medium">Bu oy davomat ma'lumoti yo'q</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Kunlik belgilash bo'limidan davomat qo'shing</p>
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="card p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">{monthlyStats.summary.present}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">Keldi</p>
                    </div>
                    <div className="card p-3 text-center">
                      <p className="text-xl font-bold text-amber-600">{monthlyStats.summary.late}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">Kechikdi</p>
                    </div>
                    <div className="card p-3 text-center">
                      <p className="text-xl font-bold text-rose-600">{monthlyStats.summary.absent}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">Kelmadi</p>
                    </div>
                  </div>

                  {/* Low attendance warning */}
                  {monthlyStats.students.some(s => s.lowAttendance) && (
                    <div className="card p-4 border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Kam qatnashganlar</p>
                      </div>
                      <div className="space-y-1.5">
                        {monthlyStats.students.filter(s => s.lowAttendance).map(s => (
                          <div key={s.studentId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <TrendingDown size={13} className="text-amber-600 shrink-0" />
                              <span className="text-sm font-medium text-[var(--text-primary)] truncate">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {s.parentPhone && (
                                <a href={`tel:${s.parentPhone}`} className="text-xs text-indigo-600 hover:underline">
                                  <Phone size={12} />
                                </a>
                              )}
                              <AttendanceBadge rate={s.attendanceRate} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-student stats */}
                  <div className="card divide-y divide-[var(--border-color)]">
                    <div className="px-4 py-2.5 flex items-center justify-between bg-[var(--bg-page)]">
                      <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">O'quvchi</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-emerald-600 w-8 text-center">Bor</span>
                        <span className="text-xs font-bold text-amber-600 w-8 text-center">Kech</span>
                        <span className="text-xs font-bold text-rose-600 w-8 text-center">Yo'q</span>
                        <span className="text-xs font-bold text-[var(--text-muted)] w-10 text-right">%</span>
                      </div>
                    </div>
                    {monthlyStats.students.map(s => (
                      <div key={s.studentId} className="px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{s.attended}/{s.totalLessons} dars</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-sm font-bold text-emerald-600 w-8 text-center">{s.present}</span>
                          <span className="text-sm font-bold text-amber-600 w-8 text-center">{s.late}</span>
                          <span className="text-sm font-bold text-rose-600 w-8 text-center">{s.absent}</span>
                          <div className="w-10 flex justify-end">
                            <AttendanceBadge rate={s.attendanceRate} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-center text-[var(--text-muted)]">
                    Jami {monthlyStats.totalLessons} ta dars belgilangan
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── To'lovlar tab ────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input type="month" value={month.slice(0, 7)}
              onChange={e => { const m = e.target.value + '-01'; setMonth(m); load(m) }}
              className="input-base flex-1"
            />
            <Button size="sm" variant="secondary" leftIcon={<CreditCard size={14} />}
              onClick={() => { setPaymentMonth(month.slice(0, 7)); setPaymentStartDate(month.slice(0, 7) + '-01'); setShowPaymentModal(true) }}>
              Oylik
            </Button>
          </div>

          {(paidCount > 0 || dueCount > 0) && (
            <div className="card p-4">
              <div className="flex justify-between text-sm mb-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Yig'ilgan</p>
                  <p className="font-bold text-emerald-600">{formatMoney(ps.sums.paid)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Kutilmoqda</p>
                  <p className="font-bold text-rose-600">{formatMoney(ps.sums.due)}</p>
                </div>
              </div>
              {ps.counts.total > 0 && (
                <div className="h-2 bg-[var(--bg-page)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(paidCount / ps.counts.total) * 100}%` }} />
                </div>
              )}
            </div>
          )}

          <div className="card divide-y divide-[var(--border-color)]">
            {groupStudents.filter(s => !!s.paymentThisMonth).length === 0 ? (
              <p className="text-center text-sm text-[var(--text-muted)] py-8">Bu oy uchun to'lovlar yaratilmagan</p>
            ) : (
              groupStudents.filter(s => !!s.paymentThisMonth).map(s => (
                <StudentRow key={s.id} student={s}
                  groupPrice={data?.group.monthlyPrice || '0'}
                  onPay={(st, p) => { setPayTarget(p); setPayStudentName(st.name); setPayModalOpen(true) }}
                  onUnpay={handleUnpay}
                  onDelete={s => setDeleteStudent(s)}
                  onEdit={s => { setEditStudent(s); setEditStudentName(s.name); setEditStudentPhone(s.parentPhone || ''); setEditStudentPaymentStartDate(s.paymentStartDate ? s.paymentStartDate.slice(0, 10) : ''); setEditStudentCustomMonthlyFee(s.customMonthlyFee ? String(s.customMonthlyFee) : ''); setEditStudentGroupId(String(id)) }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────── */}
      <PayModal
        payment={payTarget}
        studentName={payStudentName}
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onPaid={(updated, newPersistentFee) => {
          setData(prev => {
            if (!prev) return prev
            return {
              ...prev,
              students: prev.students.map(s => {
                if (s.paymentThisMonth?.id === updated.id) {
                  return {
                    ...s,
                    // If persistent fee was changed, update it too
                    ...(newPersistentFee !== undefined ? { customMonthlyFee: newPersistentFee } : {}),
                    paymentThisMonth: { ...s.paymentThisMonth, ...updated }
                  }
                }
                return s
              })
            }
          })
          // Reload summaries and stats in background
          load()
        }}
      />

      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Oylik to'lov yaratish">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Guruh uchun oylik to'lovlarni yaratish.</p>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">To'lov oyi</label>
            <input type="month" value={paymentMonth} onChange={e => { setPaymentMonth(e.target.value); setPaymentStartDate(e.target.value + '-01') }} className="input-base w-full" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Boshlanish sanasi</label>
            <input type="date" value={paymentStartDate} onChange={e => setPaymentStartDate(e.target.value)} className="input-base w-full" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={() => setShowPaymentModal(false)}>Bekor</Button>
            <Button fullWidth onClick={createMonthPayments} loading={creatingPayments}>Yaratish</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showAddStudent} onClose={() => { setShowAddStudent(false); setNameError('') }} title="O'quvchi qo'shish">
        <form onSubmit={handleAddStudent} className="space-y-4">
          <Input label="Ism *" value={newName} onChange={e => { setNewName(e.target.value); setNameError('') }} error={nameError} placeholder="O'quvchi ismi" disabled={addingStudent} autoFocus />
          <Input label="Ota-ona telefon" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+998901234567" disabled={addingStudent} />
          <Input label="To'lov boshlanish sanasi" type="date" value={newPaymentStartDate} onChange={e => setNewPaymentStartDate(e.target.value)} disabled={addingStudent} />
          <Input label="Maxsus oylik to'lov" type="number" value={newCustomMonthlyFee} onChange={e => setNewCustomMonthlyFee(e.target.value)} placeholder="Guruh narxi o'rniga" disabled={addingStudent} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowAddStudent(false)} disabled={addingStudent}>Bekor</Button>
            <Button type="submit" fullWidth loading={addingStudent}>Qo'shish</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteStudent} onClose={() => setDeleteStudent(null)} title="O'quvchini chiqarish">
        <p className="text-sm text-[var(--text-muted)] mb-5"><strong>{deleteStudent?.name}</strong> guruhdan chiqariladi. To'lov tarixi saqlanadi.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteStudent(null)}>Bekor</Button>
          <Button variant="danger" fullWidth onClick={() => deleteStudent && handleDeleteStudent(deleteStudent)}>Chiqarish</Button>
        </div>
      </Modal>

      <Modal open={!!editStudent} onClose={() => setEditStudent(null)} title="O'quvchini tahrirlash">
        <form onSubmit={handleEditStudentSubmit} className="space-y-4">
          <Input label="Ism" value={editStudentName} onChange={e => setEditStudentName(e.target.value)} autoFocus />
          <Input label="Telefon" value={editStudentPhone} onChange={e => setEditStudentPhone(e.target.value)} placeholder="+998901234567" />
          <Input label="Maxsus oylik to'lov" type="number" value={editStudentCustomMonthlyFee} onChange={e => setEditStudentCustomMonthlyFee(e.target.value)} />
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Guruhni o'zgartirish</label>
            <select className="input-base w-full" value={editStudentGroupId} onChange={e => setEditStudentGroupId(e.target.value)}>
              <option value={id}>{group.name} (Joriy)</option>
              {allGroups.filter(g => String(g.id) !== id).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setEditStudent(null)}>Bekor</Button>
            <Button type="submit" fullWidth>Saqlash</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showBulkRemove} onClose={() => setShowBulkRemove(false)} title="Guruhni tozalash">
        <p className="text-sm text-[var(--text-muted)] mb-5">Barcha o'quvchilar guruhdan chiqariladi. Tasdiqlaysizmi?</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowBulkRemove(false)}>Bekor</Button>
          <Button variant="danger" fullWidth onClick={handleBulkRemove}>Chiqarish</Button>
        </div>
      </Modal>

      <Modal open={showBulkMove} onClose={() => setShowBulkMove(false)} title="O'quvchilarni ko'chirish">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Barcha faol o'quvchilarni boshqa guruhga o'tkazish:</p>
          <select className="input-base w-full" value={targetGroupId} onChange={e => setTargetGroupId(e.target.value)}>
            <option value="">Guruhni tanlang...</option>
            {allGroups.filter(g => g.id !== Number(id)).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowBulkMove(false)}>Bekor</Button>
            <Button fullWidth onClick={handleBulkMove}>Ko'chirish</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showEditGroup} onClose={() => setShowEditGroup(false)} title="Guruhni tahrirlash">
        <form onSubmit={handleEditGroup} className="space-y-4">
          <Input label="Guruh nomi *" value={editName} onChange={e => setEditName(e.target.value)} required />
          <Input label="Fan" value={editSubject} onChange={e => setEditSubject(e.target.value)} />
          <Input label="Oylik to'lov *" type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} required />
          <Input label="Dars vaqti" value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="14:00" />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowEditGroup(false)}>Bekor</Button>
            <Button type="submit" fullWidth>Saqlash</Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Move Modal */}
      <Modal open={showBulkActionModal === 'move'} onClose={() => setShowBulkActionModal(null)} title="Ko'chirish">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Tanlangan <strong>{selectedStudents.size}</strong> ta o'quvchini qaysi guruhga ko'chirasiz?
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Guruhni tanlang</label>
            <select
              title="Guruhlar"
              value={targetGroupId}
              onChange={e => setTargetGroupId(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow text-sm"
            >
              <option value="">Tanlang...</option>
              {allGroups.filter(g => String(g.id) !== id).map(g => (
                <option key={g.id} value={g.id}>{g.name} ({formatMoney(g.monthlyPrice, '')})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowBulkActionModal(null)}>Bekor</Button>
            <Button fullWidth loading={bulkLoading} onClick={handleBulkMove}>Ko'chirish</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Archive Modal */}
      <Modal open={showBulkActionModal === 'archive'} onClose={() => setShowBulkActionModal(null)} title="Arxivlash" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Tanlangan <strong>{selectedStudents.size}</strong> ta o'quvchini arxivga o'tkazasizmi?
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowBulkActionModal(null)}>Bekor</Button>
            <Button fullWidth loading={bulkLoading} onClick={executeBulkArchive} className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600">Arxivlash</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Create Payment Modal */}
      <Modal open={showBulkActionModal === 'payment'} onClose={() => setShowBulkActionModal(null)} title="To'lov qo'shish" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)] bg-indigo-50 p-3 rounded-lg text-indigo-800">
            Tanlangan <strong>{selectedStudents.size}</strong> ta o'quvchiga oylik to'lov summasi biriktiriladi.
          </p>
          <Input
            type="month"
            label="Qaysi oy uchun"
            value={paymentMonth}
            onChange={e => {
              setPaymentMonth(e.target.value)
              setPaymentStartDate(e.target.value + '-01')
            }}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowBulkActionModal(null)}>Bekor</Button>
            <Button fullWidth loading={bulkLoading} onClick={executeBulkCreatePayment}>Yaratish</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Message Modal */}
      <Modal open={showBulkActionModal === 'message'} onClose={() => setShowBulkActionModal(null)} title="Xabar yuborish" size="md">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Tanlangan <strong>{selectedStudents.size}</strong> ta o'quvchining ota-onasiga Telegram orqali xabar boradi.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBulkMessageText("Hurmatli ota-ona! Farzandingizning bu oylik to'lov muddati yaqinlashdi. Iltimos to'lovni amalga oshiring.")}
              className="text-xs bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              To'lov eslatmasi
            </button>
            <button
              onClick={() => setBulkMessageText("Hurmatli ota-ona! Darsimiz qoldirildi, qo'shimcha dars vaqti ma'lum qilinadi.")}
              className="text-xs bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              Dars qoldirildi
            </button>
            <button
              onClick={() => setBulkMessageText("Hurmatli ota-ona! Bayram munosabati bilan bugun dars bo'lmaydi.")}
              className="text-xs bg-[var(--bg-page)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              Bayram tabrigi
            </button>
          </div>

          <textarea
            value={bulkMessageText}
            onChange={e => setBulkMessageText(e.target.value)}
            className="w-full h-32 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow text-sm resize-none"
            placeholder="Xabar matnini kiriting..."
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowBulkActionModal(null)}>Bekor</Button>
            <Button fullWidth loading={bulkLoading} onClick={executeBulkMessage}>Yuborish</Button>
          </div>
        </div>
      </Modal>

      {/* Excel Import Modal */}
      <Modal open={showImportModal} onClose={() => { setShowImportModal(false); setImportFile(null); setImportPreview([]); setImportResult(null) }} title="Exceldan o'quvchilarni import qilish" size="md">
        {importResult ? (
          <div className="space-y-4">
            <div className="card bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 text-center">
              <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2" />
              <h3 className="font-bold text-emerald-800 dark:text-emerald-300">Import yakunlandi</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                {importResult.imported} ta qo'shildi, {importResult.skipped} ta o'tkazib yuborildi
              </p>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-rose-600 mb-2">Quyidagi qatorlarda xatolik bor:</p>
                <div className="max-h-[30vh] overflow-y-auto card p-2 bg-[var(--bg-page)] text-sm space-y-1">
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} className="flex gap-2 text-[var(--text-secondary)] border-b last:border-0 border-[var(--border-color)] pb-1 last:pb-0">
                      <span className="font-medium text-[var(--text-primary)] w-16">Qator {err.row}:</span>
                      <span className="flex-1 text-rose-500">{err.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 mt-2">
              <Button onClick={() => { setShowImportModal(false); setImportFile(null); setImportPreview([]); setImportResult(null) }}>Tugatish</Button>
            </div>
          </div>
        ) : !importPreview.length ? (
          <form onSubmit={handlePreviewImport} className="space-y-4">
            <div className="card text-center p-6 border-dashed border-2 bg-indigo-50/50 dark:bg-indigo-900/10 border-[var(--border-color)]">
              <input type="file" accept=".xlsx,.csv" onChange={e => setImportFile(e.target.files?.[0] || null)} className="mb-4 text-sm w-full text-[var(--text-primary)]" />
              <p className="text-xs text-[var(--text-muted)]">Faqat .xlsx yoki .csv formatda yuklang. <br />Ustunlar tartibi: Ism, Telefon, Oylik to'lov summasi</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowImportModal(false)}>Bekor</Button>
              <Button type="submit" loading={importLoading} disabled={!importFile}>O'qish</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">Topilgan o'quvchilar ({importPreview.length} ta):</p>
            <div className="max-h-[40vh] overflow-y-auto card p-2 space-y-2 bg-[var(--bg-page)] shadow-inner">
              {importPreview.map((s, idx) => (
                <div key={idx} className={`flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0 border-[var(--border-color)] ${s.error ? 'opacity-70' : ''}`}>
                  <div>
                    <p className={`font-semibold ${s.error ? 'text-rose-600' : 'text-[var(--text-primary)]'}`}>{s.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{s.parentPhone || 'Telefon yo\'q'}</p>
                    {s.error && <p className="text-xs text-rose-500 mt-0.5 font-medium">{s.error}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--text-primary)] font-medium">{s.customMonthlyFee ? formatMoney(String(s.customMonthlyFee), '') : 'Guruh narxi'}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)] mt-2">
              <Button type="button" variant="secondary" onClick={() => { setImportPreview([]); setImportFile(null); setImportResult(null) }}>Ortga</Button>
              <Button onClick={handleConfirmImport} loading={importLoading}>Tasdiqlash va Saqlash</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
