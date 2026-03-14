import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Search, Users, Send,
  CheckCircle2, X, Loader2,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney } from '../lib/date'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import type { PaymentStatus } from '../types'

interface DebtorItem {
  id: number
  month: string
  amount: string
  paidAmount: string
  remainingAmount?: string
  remaining: string
  status: PaymentStatus
  student: {
    id: number
    name: string
    parentPhone: string | null
    group: { id: number; name: string } | null
  }
}

interface NotifyResult {
  message: string
  sent: number
  noLink: number
  total: number
  sentTo: Array<{ name: string; phone: string }>
}

export default function DebtorsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [items, setItems] = useState<DebtorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([])
  const [filterGroup, setFilterGroup] = useState('')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Telegram notify state
  const [notifying, setNotifying] = useState(false)
  const [notifyResult, setNotifyResult] = useState<NotifyResult | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

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
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [month, filterGroup])
  useEffect(() => {
    api.get('/api/groups')
      .then(res => setGroups(res.data.groups || []))
      .catch(() => { })
  }, [])

  const displayed = search.trim()
    ? items.filter(i => i.student.name.toLowerCase().includes(search.toLowerCase()))
    : items

  // Telegram bor ota-onalar soni (hamma emas, lekin estimate)
  const withPhone = displayed.filter(i => i.student.parentPhone).length

  async function handleNotify() {
    setShowConfirm(false)
    setNotifying(true)
    setNotifyResult(null)
    try {
      const res = await api.post('/api/payments/notify-debtors', { month })
      setNotifyResult(res.data)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      if (msg?.includes('sozlanmagan')) {
        toast.error("Telegram bot sozlanmagan. Backend .env faylini tekshiring.")
      } else {
        toast.error(msg || 'Xatolik yuz berdi')
      }
    } finally { setNotifying(false) }
  }

  function statusBadge(s: PaymentStatus) {
    const map: Record<string, { text: string; cls: string }> = {
      DUE: { text: 'Qarzdor', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
      PARTIAL: { text: 'Qisman', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    }
    const d = map[s] || { text: s, cls: 'bg-slate-100 text-slate-600' }
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.cls}`}>{d.text}</span>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Qarzdorlar</h1>
          <p className="page-subtitle">{displayed.length} ta yozuv</p>
        </div>

        {/* Telegram notify button */}
        {displayed.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={notifying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            onClick={() => setShowConfirm(true)}
            disabled={notifying}
          >
            Xabar yuborish
          </Button>
        )}
      </div>

      {/* Notify result banner */}
      {notifyResult && (
        <div className={[
          'card p-4 flex items-start gap-3 animate-fade-in',
          notifyResult.sent > 0
            ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10'
            : 'border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10',
        ].join(' ')}>
          <div className={[
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            notifyResult.sent > 0
              ? 'bg-emerald-100 dark:bg-emerald-900/40'
              : 'bg-amber-100 dark:bg-amber-900/40',
          ].join(' ')}>
            {notifyResult.sent > 0
              ? <CheckCircle2 size={18} className="text-emerald-600" />
              : <Send size={18} className="text-amber-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={[
              'font-bold text-sm',
              notifyResult.sent > 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400',
            ].join(' ')}>
              {notifyResult.message}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
              <span>Jami: {notifyResult.total}</span>
              <span className="text-emerald-600 font-semibold">✓ {notifyResult.sent} yuborildi</span>
              {notifyResult.noLink > 0 && (
                <span className="text-amber-600">{notifyResult.noLink} Telegram yo'q</span>
              )}
            </div>
            {notifyResult.sentTo.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {notifyResult.sentTo.map((s, i) => (
                  <span key={i} className="text-[11px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setNotifyResult(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="input-base"
          />
          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            className="input-base"
          >
            <option value="">Barcha guruhlar</option>
            {groups.map(g => (
              <option key={g.id} value={String(g.id)}>{g.name}</option>
            ))}
          </select>
        </div>
        <Input
          placeholder="Ism bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search size={15} />}
        />
      </div>

      {/* List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : displayed.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
            <Users size={26} className="text-emerald-500" />
          </div>
          <p className="font-bold text-[var(--text-primary)]">Qarzdor yo'q</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Barcha to'lovlar amalga oshirilgan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(item => {
            const isLarge = Number(item.remaining) > 500_000
            return (
              <div
                key={item.id}
                className={[
                  'card p-4 animate-fade-in',
                  isLarge ? 'border-rose-200 dark:border-rose-900/40' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-[var(--text-primary)] truncate">{item.student.name}</p>
                      {statusBadge(item.status)}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {item.student.group?.name || '—'} • {item.month}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={['text-lg font-bold', Number(item.remainingAmount || item.remaining) > 500000 ? 'text-rose-600' : 'text-rose-500'].join(' ')}>
                      {formatMoney(item.remainingAmount || item.remaining, '')}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Qarzdorlik</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-dashed border-[var(--border-color)]">
                  <div className="bg-[var(--bg-page)] p-2 rounded-lg">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase mb-0.5">Jami summa</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{formatMoney(item.amount, '')}</p>
                  </div>
                  <div className="bg-[var(--bg-page)] p-2 rounded-lg">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase mb-0.5">To'langan</p>
                    <p className="text-sm font-bold text-emerald-600">{formatMoney(item.paidAmount, '')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.student.parentPhone ? (
                      <a
                        href={`tel:${item.student.parentPhone}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1.5"
                      >
                        📞 {item.student.parentPhone}
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Telefon yo'q</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/students/${item.student.id}/history`)}
                    className="rounded-xl shadow-sm"
                  >
                    Batafsil
                  </Button>
                </div>

                {/* Partial progress bar */}
                {item.status === 'PARTIAL' && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>To'langan: {formatMoney(item.paidAmount, '')}</span>
                      <span>Jami: {formatMoney(item.amount, '')}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${(Number(item.paidAmount) / Number(item.amount)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm modal */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Telegram xabar yuborish"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-[var(--bg-page)] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Oy:</span>
              <span className="font-semibold">{month}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Qarzdorlar:</span>
              <span className="font-bold text-rose-600">{displayed.length} ta</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Telefon bor:</span>
              <span className="font-semibold">{withPhone} ta</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Faqat Telegram bilan ulangan ota-onalarga xabar ketadi. Bot bilan ulanmagan ota-onalarga xabar bormaydi.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowConfirm(false)}>
              Bekor
            </Button>
            <Button
              fullWidth
              leftIcon={<Send size={15} />}
              onClick={handleNotify}
              loading={notifying}
            >
              Yuborish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
