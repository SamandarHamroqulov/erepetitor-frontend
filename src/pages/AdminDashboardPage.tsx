import { useEffect, useState } from 'react'
import {
    Shield, Users, BookOpen, GraduationCap, CreditCard,
    UserCheck, UserX, CheckCircle2, XCircle, Clock,
    TrendingUp,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney, formatDate } from '../lib/date'

import { useNavigate } from 'react-router-dom'

interface AdminStats {
    month: string
    overview: {
        totalTeachers: number
        activeTeachers: number
        totalGroups: number
        totalStudents: number
        activeStudents: number
        deletedStudents: number
    }
    payments: {
        month: string
        dueCount: number
        paidCount: number
        dueSum: string
        paidSum: string
        expectedSum: string
    }
    billing: {
        pendingRequests: number
    }
}

function StatCard({
    icon: Icon,
    label,
    value,
    color = 'indigo',
    sub,
    onClick,
    cursor = 'default',
}: {
    icon: React.ElementType
    label: string
    value: string | number
    color?: string
    sub?: string
    onClick?: () => void
    cursor?: string
}) {
    const colorMap: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    }
    return (
        <div
            className={`card p-4 ${onClick ? 'cursor-pointer hover:bg-[var(--bg-page)] transition-colors' : ''}`}
            onClick={onClick}
            style={{ cursor }}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.indigo}`}>
                    <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{label}</p>
                    {sub && <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>}
                </div>
            </div>
        </div>
    )
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)
    const toast = useToast()
    const navigate = useNavigate()

    useEffect(() => {
        async function load() {
            try {
                const res = await api.get('/api/admin/stats')
                setData(res.data)
            } catch (err: unknown) {
                toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) return <div className="pt-4"><SkeletonList count={4} /></div>
    if (!data) return <p className="text-center py-10 text-[var(--text-secondary)]">Ma'lumot yuklanmadi</p>

    const { overview: ov, payments: pay, billing } = data

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/20">
                    <Shield size={22} />
                </div>
                <div>
                    <h1 className="page-title">Tizim holati</h1>
                    <p className="page-subtitle">Platforma boshqaruv paneli · {data.month}</p>
                </div>
            </div>

            {/* Static Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={GraduationCap} label="Jami o'qituvchilar" value={ov.totalTeachers} color="purple" sub={`${ov.activeTeachers} ta faol`} />
                <StatCard icon={Users} label="Jami o'quvchilar" value={ov.totalStudents} color="indigo" sub={`${ov.activeStudents} ta faol`} />
                <StatCard icon={BookOpen} label="Guruhlar soni" value={ov.totalGroups} color="blue" />
                <StatCard
                    icon={CreditCard}
                    label="Kutilayotgan to'lovlar"
                    value={billing?.pendingRequests || 0}
                    color="amber"
                    cursor="pointer"
                    onClick={() => navigate('/admin/billing')}
                    sub="Tasdiqlash so'rovlari"
                />
            </div>

            <h2 className="text-sm font-semibold text-[var(--text-primary)] mt-6 mb-3">Moliyaviy ko'rsatkichlar ({data.month})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <StatCard icon={CheckCircle2} label="Oylik daromad" value={formatMoney(pay.paidSum)} color="emerald" sub={`${pay.paidCount} ta tasdiqlangan to'lov`} />
                <StatCard icon={XCircle} label="Qarzdorlik" value={formatMoney(pay.dueSum)} color="rose" sub={`${pay.dueCount} ta to'lanmagan`} />
            </div>
        </div>
    )
}
