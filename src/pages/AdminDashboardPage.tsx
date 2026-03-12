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

interface TeacherRow {
    id: number
    name: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
    groupsCount: number
    studentsCount: number
}

interface GroupRow {
    id: number
    name: string
    subject: string | null
    monthlyPrice: string
    teacherName: string
    teacherId: number
    activeStudents: number
    createdAt: string
}

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
    attendance: {
        date: string
        present: number
        absent: number
        late: number
        total: number
    }
    teachers: TeacherRow[]
    groups: GroupRow[]
}

type AdminTab = 'overview' | 'teachers' | 'groups' | 'students'

function StatCard({
    icon: Icon,
    label,
    value,
    color = 'indigo',
    sub,
}: {
    icon: React.ElementType
    label: string
    value: string | number
    color?: string
    sub?: string
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
        <div className="card p-4">
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
    const [tab, setTab] = useState<AdminTab>('overview')
    const toast = useToast()

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

    if (loading) return <div className="pt-4"><SkeletonList count={8} /></div>
    if (!data) return <p className="text-center py-10 text-[var(--text-secondary)]">Ma'lumot yuklanmadi</p>

    const { overview: ov, payments: pay, attendance: att, teachers, groups } = data

    const tabs: { key: AdminTab; label: string }[] = [
        { key: 'overview', label: 'Umumiy' },
        { key: 'teachers', label: "O'qituvchilar" },
        { key: 'groups', label: 'Guruhlar' },
        { key: 'students', label: "O'quvchilar" },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/20">
                    <Shield size={22} />
                </div>
                <div>
                    <h1 className="page-title">Admin boshqaruv paneli</h1>
                    <p className="page-subtitle">Tizim ko'rinishi · {data.month}</p>
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

            {/* ═══════ OVERVIEW TAB ═══════ */}
            {tab === 'overview' && (
                <div className="space-y-6">
                    {/* Main stats grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <StatCard icon={GraduationCap} label="O'qituvchilar" value={ov.totalTeachers} color="purple" sub={`${ov.activeTeachers} faol`} />
                        <StatCard icon={BookOpen} label="Guruhlar" value={ov.totalGroups} color="blue" />
                        <StatCard icon={Users} label="O'quvchilar" value={ov.totalStudents} color="indigo" sub={`${ov.activeStudents} faol`} />
                        <StatCard icon={TrendingUp} label="Kutilgan daromad" value={formatMoney(pay.expectedSum)} color="emerald" sub={data.month} />
                        <StatCard icon={CheckCircle2} label="To'langan" value={formatMoney(pay.paidSum)} color="emerald" sub={`${pay.paidCount} ta`} />
                        <StatCard icon={XCircle} label="Qarzdorlik" value={formatMoney(pay.dueSum)} color="rose" sub={`${pay.dueCount} ta`} />
                    </div>

                    {/* Today's attendance */}
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Bugungi davomat ({att.date})</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard icon={Users} label="Jami" value={att.total} color="indigo" />
                            <StatCard icon={UserCheck} label="Bor" value={att.present} color="emerald" />
                            <StatCard icon={UserX} label="Yo'q" value={att.absent} color="rose" />
                            <StatCard icon={Clock} label="Kechikdi" value={att.late} color="amber" />
                        </div>
                    </div>

                    {/* Quick teacher summary */}
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Top o'qituvchilar</h2>
                        <div className="card divide-y divide-[var(--border-color)]">
                            {teachers.slice(0, 5).map(t => (
                                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                                    <div className="w-9 h-9 rounded-full bg-[var(--bg-page)] flex items-center justify-center text-sm font-bold text-[var(--text-secondary)]">
                                        {t.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-[var(--text-primary)] truncate">{t.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{t.email}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{t.groupsCount} guruh</p>
                                        <p className="text-xs text-[var(--text-muted)]">{t.studentsCount} o'quvchi</p>
                                    </div>
                                </div>
                            ))}
                            {teachers.length === 0 && (
                                <p className="text-sm text-[var(--text-secondary)] text-center py-6">O'qituvchilar yo'q</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ TEACHERS TAB ═══════ */}
            {tab === 'teachers' && (
                <div className="space-y-4">
                    <div className="card overflow-hidden">
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[var(--bg-page)] text-left text-[var(--text-secondary)] text-xs font-semibold">
                                        <th className="px-4 py-3">Ism</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Ro'l</th>
                                        <th className="px-4 py-3">Holat</th>
                                        <th className="px-4 py-3">Guruhlar</th>
                                        <th className="px-4 py-3">O'quvchilar</th>
                                        <th className="px-4 py-3">Yaratilgan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {teachers.map(t => (
                                        <tr key={t.id} className="hover:bg-[var(--bg-page)] transition-colors">
                                            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{t.name}</td>
                                            <td className="px-4 py-3 text-[var(--text-secondary)]">{t.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.role === 'ADMIN'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {t.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block w-2 h-2 rounded-full ${t.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold">{t.groupsCount}</td>
                                            <td className="px-4 py-3 text-center font-semibold">{t.studentsCount}</td>
                                            <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{formatDate(t.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile list */}
                        <div className="sm:hidden divide-y divide-[var(--border-color)]">
                            {teachers.map(t => (
                                <div key={t.id} className="px-4 py-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm text-[var(--text-primary)]">{t.name}</p>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.role === 'ADMIN'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {t.role}
                                        </span>
                                        <span className={`inline-block w-2 h-2 rounded-full ml-auto ${t.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">{t.email}</p>
                                    <div className="flex gap-4 mt-1 text-xs text-[var(--text-secondary)]">
                                        <span>{t.groupsCount} guruh</span>
                                        <span>{t.studentsCount} o'quvchi</span>
                                        <span>{formatDate(t.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {teachers.length === 0 && (
                            <p className="text-sm text-[var(--text-secondary)] text-center py-8">O'qituvchilar yo'q</p>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════ GROUPS TAB ═══════ */}
            {tab === 'groups' && (
                <div className="space-y-4">
                    <div className="card overflow-hidden">
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[var(--bg-page)] text-left text-[var(--text-secondary)] text-xs font-semibold">
                                        <th className="px-4 py-3">Guruh</th>
                                        <th className="px-4 py-3">Fan</th>
                                        <th className="px-4 py-3">O'qituvchi</th>
                                        <th className="px-4 py-3">O'quvchilar</th>
                                        <th className="px-4 py-3">Oylik narx</th>
                                        <th className="px-4 py-3">Yaratilgan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {groups.map(g => (
                                        <tr key={g.id} className="hover:bg-[var(--bg-page)] transition-colors">
                                            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{g.name}</td>
                                            <td className="px-4 py-3 text-[var(--text-secondary)]">{g.subject || '—'}</td>
                                            <td className="px-4 py-3 text-[var(--text-secondary)]">{g.teacherName}</td>
                                            <td className="px-4 py-3 text-center font-semibold">{g.activeStudents}</td>
                                            <td className="px-4 py-3 font-semibold text-indigo-600">{formatMoney(g.monthlyPrice, '')}</td>
                                            <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{formatDate(g.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile list */}
                        <div className="sm:hidden divide-y divide-[var(--border-color)]">
                            {groups.map(g => (
                                <div key={g.id} className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-sm text-[var(--text-primary)]">{g.name}</p>
                                        <span className="text-sm font-semibold text-indigo-600">{formatMoney(g.monthlyPrice, '')}</span>
                                    </div>
                                    <div className="flex gap-3 text-xs text-[var(--text-secondary)]">
                                        <span>{g.teacherName}</span>
                                        <span>{g.activeStudents} o'quvchi</span>
                                        {g.subject && <span>{g.subject}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {groups.length === 0 && (
                            <p className="text-sm text-[var(--text-secondary)] text-center py-8">Guruhlar yo'q</p>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════ STUDENTS TAB ═══════ */}
            {tab === 'students' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <StatCard icon={Users} label="Jami o'quvchilar" value={ov.totalStudents} color="indigo" />
                        <StatCard icon={UserCheck} label="Faol" value={ov.activeStudents} color="emerald" />
                        <StatCard icon={UserX} label="O'chirilgan" value={ov.deletedStudents} color="rose" />
                    </div>

                    {/* Students by teacher */}
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">O'qituvchilar bo'yicha</h2>
                        <div className="card divide-y divide-[var(--border-color)]">
                            {teachers.map(t => (
                                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-page)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                                            {t.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-[var(--text-primary)] truncate">{t.name}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{t.groupsCount} guruh</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-bold text-[var(--text-primary)]">{t.studentsCount}</p>
                                        <p className="text-[10px] text-[var(--text-muted)]">o'quvchi</p>
                                    </div>
                                </div>
                            ))}
                            {teachers.length === 0 && (
                                <p className="text-sm text-[var(--text-secondary)] text-center py-6">Ma'lumot yo'q</p>
                            )}
                        </div>
                    </div>

                    {/* Payment status */}
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">To'lov holati ({data.month})</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard icon={CheckCircle2} label="To'lagan" value={pay.paidCount} color="emerald" />
                            <StatCard icon={CreditCard} label="Qarzdor" value={pay.dueCount} color="rose" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
