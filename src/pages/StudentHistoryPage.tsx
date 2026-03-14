import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ChevronLeft, User, Phone, BookOpen, Calendar,
    CheckCircle2, XCircle, Clock, CreditCard, TrendingUp,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney, formatDate } from '../lib/date'
import type { AttendanceStatus, PaymentStatus } from '../types'

interface StudentInfo {
    id: number
    name: string
    parentPhone: string | null
    isActive: boolean
    createdAt: string
    group: { id: number; name: string } | null
}

interface PaymentRecord {
    id: number
    month: string
    amount: string
    paidAmount: string
    remainingAmount?: string
    remaining: string
    status: PaymentStatus
    paidAt: string | null
    createdAt: string
    histories?: { amount: string; createdAt: string; note?: string | null }[]
}

interface AttendanceRecord {
    id: number
    date: string
    status: AttendanceStatus
    groupName: string
}

interface StudentStats {
    totalLessons: number
    totalPresent: number
    totalAbsent: number
    totalLate: number
    totalPayments: number
    totalPaidAmount: string
    totalUnpaidAmount: string
}

interface HistoryData {
    student: StudentInfo
    payments: PaymentRecord[]
    attendance: AttendanceRecord[]
    stats: StudentStats
}

type HistoryTab = 'stats' | 'payments' | 'attendance'

function StatCard({ icon: Icon, label, value, color = 'indigo' }: {
    icon: React.ElementType; label: string; value: string | number; color?: string
}) {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    }
    return (
        <div className="card p-3">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color] || colors.indigo}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
                </div>
            </div>
        </div>
    )
}

const statusBadge = (s: PaymentStatus) => {
    const map: Record<string, string> = {
        PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        PARTIAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        DUE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    }
    const labels: Record<string, string> = { PAID: "To'langan", PARTIAL: "Qisman", DUE: "Qarzdor" }
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[s] || ''}`}>
            {labels[s] || s}
        </span>
    )
}

const attendanceBadge = (s: AttendanceStatus) => {
    const map: Record<string, string> = {
        PRESENT: 'text-emerald-600',
        ABSENT: 'text-rose-600',
        LATE: 'text-amber-600',
    }
    const labels: Record<string, string> = { PRESENT: 'Bor', ABSENT: "Yo'q", LATE: 'Kechikdi' }
    return <span className={`text-xs font-semibold ${map[s] || ''}`}>{labels[s] || s}</span>
}

export default function StudentHistoryPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const toast = useToast()
    const [data, setData] = useState<HistoryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<HistoryTab>('stats')
    const [payModalOpen, setPayModalOpen] = useState(false)
    const [payTarget, setPayTarget] = useState<PaymentRecord | null>(null)

    async function load() {
        try {
            const res = await api.get(`/api/students/${id}/history`)
            setData(res.data)
        } catch (err: unknown) {
            toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
            navigate(-1)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [id])

    if (loading) return <div className="pt-4"><SkeletonList count={6} /></div>
    if (!data) return null

    const { student, payments, attendance, stats } = data

    const tabs: { key: HistoryTab; label: string }[] = [
        { key: 'stats', label: 'Statistika' },
        { key: 'payments', label: "To'lovlar" },
        { key: 'attendance', label: 'Davomat' },
    ]

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-slate-200 transition-colors">
                    <ChevronLeft size={22} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">{student.name}</h1>
                    <p className="text-sm text-[var(--text-secondary)]">O'quvchi tarixi</p>
                </div>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${student.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>

            {/* Student info card */}
            <div className="card p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-[var(--text-muted)]" />
                    <span className="font-medium text-[var(--text-primary)]">{student.name}</span>
                </div>
                {student.parentPhone && (
                    <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-[var(--text-muted)]" />
                        <a href={`tel:${student.parentPhone}`} className="text-[var(--text-secondary)] hover:text-indigo-600">{student.parentPhone}</a>
                    </div>
                )}
                {student.group && (
                    <div className="flex items-center gap-2 text-sm">
                        <BookOpen size={14} className="text-[var(--text-muted)]" />
                        <span className="text-[var(--text-secondary)]">{student.group.name}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-[var(--text-muted)]" />
                    <span className="text-[var(--text-muted)]">{formatDate(student.createdAt)}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-color)] overflow-x-auto">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={[
                            'pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap',
                            tab === t.key
                                ? 'border-b-2 border-indigo-600 text-indigo-700'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                        ].join(' ')}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ STATS TAB ═══ */}
            {tab === 'stats' && (
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Davomat</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard icon={Calendar} label="Jami darslar" value={stats.totalLessons} color="indigo" />
                        <StatCard icon={CheckCircle2} label="Bor" value={stats.totalPresent} color="emerald" />
                        <StatCard icon={XCircle} label="Yo'q" value={stats.totalAbsent} color="rose" />
                        <StatCard icon={Clock} label="Kechikdi" value={stats.totalLate} color="amber" />
                    </div>
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pt-2">To'lovlar</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard icon={CreditCard} label="Jami to'lovlar" value={stats.totalPayments} color="indigo" />
                        <StatCard icon={TrendingUp} label="To'langan" value={formatMoney(stats.totalPaidAmount)} color="emerald" />
                        <div className="col-span-2">
                            <StatCard icon={XCircle} label="Qarzdorlik" value={formatMoney(stats.totalUnpaidAmount)} color="rose" />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PAYMENTS TAB ═══ */}
            {tab === 'payments' && (
                <div className="card overflow-hidden">
                    {payments.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] text-center py-8">To'lov tarixi yo'q</p>
                    ) : (
                        <div className="divide-y divide-[var(--border-color)]">
                            {payments.map(p => (
                                <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm text-[var(--text-primary)]">{p.month}</p>
                                            {statusBadge(p.status)}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-2 max-w-sm">
                                            <div>
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase">Jami</p>
                                                <p className="text-xs font-semibold text-[var(--text-primary)]">{formatMoney(p.amount, '')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase">To'landi</p>
                                                <p className="text-xs font-semibold text-emerald-600">{formatMoney(p.paidAmount, '')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase">Qoldi</p>
                                                <p className={`text-xs font-bold ${Number(p.remainingAmount || p.remaining) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatMoney(p.remainingAmount || p.remaining, '')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {p.status !== 'PAID' && (
                                            <button
                                                onClick={() => setPayTarget(p)}
                                                className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                                            >
                                                {p.status === 'PARTIAL' ? 'Davom' : "To'lash"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ ATTENDANCE TAB ═══ */}
            {tab === 'attendance' && (
                <div className="card overflow-hidden">
                    {attendance.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)] text-center py-8">Davomat tarixi yo'q</p>
                    ) : (
                        <div className="divide-y divide-[var(--border-color)]">
                            {attendance.map(a => (
                                <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-[var(--text-primary)]">{a.date}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{a.groupName}</p>
                                    </div>
                                    {attendanceBadge(a.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Pay Modal */}
            <Modal open={!!payTarget} onClose={() => setPayTarget(null)} title="To'lov qo'shish" size="sm">
                {payTarget && (
                    <div className="space-y-4">
                        <div className="bg-[var(--bg-page)] rounded-xl p-3.5 space-y-2">
                            <p className="font-bold text-[var(--text-primary)] text-sm">{student.name}</p>
                            <div className="grid grid-cols-1 gap-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-[var(--text-muted)]">Umumiy summa (Jami):</span>
                                    <span className="font-semibold text-[var(--text-primary)]">{formatMoney(payTarget.amount)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[var(--text-muted)]">To'langan miqdor:</span>
                                    <span className="font-semibold text-emerald-600">{formatMoney(payTarget.paidAmount)}</span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-[var(--border-color)] mt-1 pt-1">
                                    <span className="font-bold text-[var(--text-secondary)]">Qolgan qarz (Qoldi):</span>
                                    <span className={Number(payTarget.remainingAmount || payTarget.remaining) > 0 ? "font-bold text-rose-600" : "font-bold text-emerald-600"}>
                                        {formatMoney(payTarget.remainingAmount || payTarget.remaining)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Input
                            label="Summa (so'm)"
                            type="number"
                            id="payAmountInput"
                            autoFocus
                            placeholder={payTarget.remaining}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => {
                                const el = document.getElementById('payAmountInput') as HTMLInputElement;
                                if (el) el.value = payTarget.remaining;
                            }}
                                className="flex-1 py-2 text-sm font-semibold border rounded-xl bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                                To'liq
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" fullWidth onClick={() => setPayTarget(null)}>Bekor</Button>
                            <Button fullWidth onClick={async () => {
                                const el = document.getElementById('payAmountInput') as HTMLInputElement;
                                const val = Number(el?.value || 0);
                                if (!val || val <= 0) { toast.error('Summa kiriting'); return; }
                                if (val > Number(payTarget.remaining)) { toast.error(`Maksimal: ${formatMoney(payTarget.remaining, '')}`); return; }
                                try {
                                    await api.patch(`/api/payments/${payTarget.id}/pay`, { payAmount: val });
                                    toast.success("To'lov qabul qilindi!");
                                    setPayTarget(null);
                                    load();
                                } catch (err: any) {
                                    toast.error(err.message || 'Xatolik');
                                }
                            }}>To'lash</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
