import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AlertTriangle, Search, Users, Phone,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney } from '../lib/date'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import type { PaymentStatus } from '../types'

interface DebtorItem {
    id: number
    month: string
    amount: string
    paidAmount: string
    remaining: string
    status: PaymentStatus
    student: {
        id: number
        name: string
        parentPhone: string | null
        group: { id: number; name: string } | null
    }
}

interface GroupOption {
    id: number
    name: string
}

export default function DebtorsPage() {
    const navigate = useNavigate()
    const toast = useToast()
    const [items, setItems] = useState<DebtorItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [groups, setGroups] = useState<GroupOption[]>([])
    const [filterGroup, setFilterGroup] = useState('')
    const [month, setMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    async function load() {
        setLoading(true)
        try {
            const params: Record<string, string> = { date: month + '-01' }
            if (filterGroup) params.groupId = filterGroup
            if (search.trim()) params.search = search.trim()
            const res = await api.get('/api/payments/debtors', { params })
            setItems(res.data.items || [])
        } catch (err: unknown) {
            toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [month, filterGroup])

    // Load groups for filter
    useEffect(() => {
        api.get('/api/groups')
            .then(res => setGroups((res.data.groups || []).map((g: GroupOption) => ({ id: g.id, name: g.name }))))
            .catch(() => { })
    }, [])

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        load()
    }

    // Filter locally for quick search
    const displayed = search.trim()
        ? items.filter(i => i.student.name.toLowerCase().includes(search.toLowerCase()))
        : items

    const statusLabel = (s: PaymentStatus) => {
        const map: Record<string, { text: string; cls: string }> = {
            DUE: { text: 'Qarzdor', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
            PARTIAL: { text: 'Qisman', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        }
        const d = map[s] || { text: s, cls: 'bg-slate-100 text-slate-600' }
        return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${d.cls}`}>{d.text}</span>
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                    <AlertTriangle size={22} />
                </div>
                <div>
                    <h1 className="page-title">Qarzdorlar</h1>
                    <p className="page-subtitle">To'lanmagan yoki qisman to'langan</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="month"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="input-base sm:w-44"
                />
                <select
                    value={filterGroup}
                    onChange={e => setFilterGroup(e.target.value)}
                    className="input-base sm:w-48"
                >
                    <option value="">Barcha guruhlar</option>
                    {groups.map(g => (
                        <option key={g.id} value={String(g.id)}>{g.name}</option>
                    ))}
                </select>
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <Input
                        placeholder="Ism bo'yicha qidirish..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search size={16} />}
                    />
                </form>
            </div>

            {/* Content */}
            {loading ? (
                <SkeletonList count={5} />
            ) : displayed.length === 0 ? (
                <div className="card p-10 text-center">
                    <Users size={40} className="text-emerald-400 mx-auto mb-3" />
                    <p className="font-medium text-[var(--text-primary)]">Qarzdor o'quvchi yo'q</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Barcha to'lovlar amalga oshirilgan</p>
                </div>
            ) : (
                <>
                    {/* Summary */}
                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{displayed.length}</span> ta qarzdor topildi
                    </div>

                    {/* Desktop table */}
                    <div className="card overflow-hidden hidden sm:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[var(--bg-page)] text-left text-[var(--text-secondary)] text-xs font-semibold">
                                        <th className="px-4 py-3">O'quvchi</th>
                                        <th className="px-4 py-3">Guruh</th>
                                        <th className="px-4 py-3">Telefon</th>
                                        <th className="px-4 py-3">Oy</th>
                                        <th className="px-4 py-3">Summa</th>
                                        <th className="px-4 py-3">To'langan</th>
                                        <th className="px-4 py-3">Qoldiq</th>
                                        <th className="px-4 py-3">Holat</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {displayed.map(item => {
                                        const isLarge = Number(item.remaining) > 500000
                                        return (
                                            <tr key={item.id} className={`hover:bg-[var(--bg-page)] transition-colors ${isLarge ? 'bg-rose-50/50 dark:bg-rose-900/5' : ''}`}>
                                                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{item.student.name}</td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">{item.student.group?.name || '—'}</td>
                                                <td className="px-4 py-3 text-[var(--text-muted)]">
                                                    {item.student.parentPhone ? (
                                                        <a href={`tel:${item.student.parentPhone}`} className="flex items-center gap-1 hover:text-indigo-600">
                                                            <Phone size={12} />
                                                            {item.student.parentPhone}
                                                        </a>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">{item.month}</td>
                                                <td className="px-4 py-3 font-medium">{formatMoney(item.amount, '')}</td>
                                                <td className="px-4 py-3 text-emerald-600 font-medium">{formatMoney(item.paidAmount, '')}</td>
                                                <td className={`px-4 py-3 font-bold ${isLarge ? 'text-rose-600' : 'text-rose-500'}`}>
                                                    {formatMoney(item.remaining, '')}
                                                </td>
                                                <td className="px-4 py-3">{statusLabel(item.status)}</td>
                                                <td className="px-4 py-3">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => navigate(`/students/${item.student.id}/history`)}
                                                    >
                                                        Tarix
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile list */}
                    <div className="sm:hidden space-y-2">
                        {displayed.map(item => {
                            const isLarge = Number(item.remaining) > 500000
                            return (
                                <div key={item.id} className={`card p-4 ${isLarge ? 'ring-1 ring-rose-200 dark:ring-rose-800' : ''}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-sm text-[var(--text-primary)]">{item.student.name}</p>
                                        {statusLabel(item.status)}
                                    </div>
                                    <div className="flex gap-3 text-xs text-[var(--text-secondary)] mb-2">
                                        <span>{item.student.group?.name || '—'}</span>
                                        <span>{item.month}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs">
                                            <span className="text-[var(--text-muted)]">Summa: </span>
                                            <span className="font-medium">{formatMoney(item.amount, '')}</span>
                                            <span className="mx-1">·</span>
                                            <span className={`font-bold ${isLarge ? 'text-rose-600' : 'text-rose-500'}`}>
                                                Qoldiq: {formatMoney(item.remaining, '')}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/students/${item.student.id}/history`)}
                                            className="text-xs text-indigo-600 font-medium hover:underline"
                                        >
                                            Tarix →
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
