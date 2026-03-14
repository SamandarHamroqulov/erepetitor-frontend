import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CreditCard, Search, Download, CheckCircle2,
  XCircle, Clock, Send, Loader2, AlertTriangle, X,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney, formatDate, currentMonthISO } from '../lib/date'
import type { Payment } from '../types'

type FilterType = 'all' | 'paid' | 'due'

interface NotifyResult {
  message: string
  sent: number
  noLink: number
  total: number
  sentTo: Array<{ name: string; phone: string }>
}

// ── Pay Modal ─────────────────────────────────────────────
function PayModal({ payment, open, onClose, onPaid }: {
  payment: Payment | null; open: boolean; onClose: () => void; onPaid: () => void
}) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (open && payment) {
      setAmount(String(Number(payment.amount) - Number(payment.paidAmount || 0)))
      setError('')
    }
  }, [open, payment])

  async function handlePay() {
    if (!payment) return
    const val = Number(amount)
    const remaining = Number(payment.amount) - Number(payment.paidAmount || 0)
    if (!val || val <= 0) { setError('Summa kiriting'); return }
    if (val > remaining) { setError(`Maksimal: ${formatMoney(remaining)}`); return }
    setLoading(true)
    try {
      await api.patch(`/api/payments/${payment.id}/pay`, { payAmount: val })
      toast.success("To'lov qo'shildi!")
      onPaid(); onClose()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setLoading(false) }
  }

  if (!payment) return null
  const total = Number(payment.amount)
  const paid = Number(payment.paidAmount || 0)
  const remaining = Number(payment.remainingAmount || (total - paid))

  return (
    <Modal open={open} onClose={onClose} title="To'lov qo'shish" size="sm">
      <div className="space-y-4">
        <div className="bg-[var(--bg-page)] rounded-xl p-3.5 space-y-2">
          <p className="font-bold text-[var(--text-primary)]">{payment.student.name}</p>
          <p className="text-sm text-[var(--text-muted)]">{payment.student.group.name}</p>
          <div className="border-t border-[var(--border-color)] pt-2 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Jami:</span>
              <span className="font-semibold">{formatMoney(total)}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">To'langan:</span>
                <span className="font-semibold text-emerald-600">{formatMoney(paid)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Qoldi:</span>
              <span className="font-bold text-rose-600">{formatMoney(remaining)}</span>
            </div>
          </div>
        </div>
        <Input
          label="Summa (so'm)"
          type="number"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError('') }}
          error={error}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={() => setAmount(String(remaining))}
            className="flex-1 py-2 text-sm font-semibold border rounded-xl bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-400 hover:text-emerald-600 transition-colors"
          >
            To'liq: {formatMoney(remaining)}
          </button>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>Bekor</Button>
          <Button fullWidth loading={loading} onClick={handlePay}>To'lash</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Telegram Notify Modal ─────────────────────────────────
function NotifyModal({ open, onClose, month, dueCount }: {
  open: boolean; onClose: () => void; month: string; dueCount: number
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NotifyResult | null>(null)
  const toast = useToast()

  useEffect(() => { if (!open) setResult(null) }, [open])

  async function handleNotify() {
    setLoading(true)
    try {
      const res = await api.post('/api/payments/notify-debtors', {
        month: month.slice(0, 7),
      })
      setResult(res.data)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      if (msg?.includes('sozlanmagan')) {
        toast.error('Telegram bot sozlanmagan. .env faylini tekshiring.')
      } else {
        toast.error(msg || 'Xatolik yuz berdi')
      }
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Telegram xabar yuborish" size="sm">
      {!result ? (
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-[var(--bg-page)] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Oy:</span>
              <span className="font-semibold">{month.slice(0, 7)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Qarzdorlar:</span>
              <span className="font-bold text-rose-600">{dueCount} ta</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Faqat Telegram botiga <strong>/start</strong> bosib telefonini ulagan ota-onalarga xabar ketadi.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>Bekor</Button>
            <Button
              fullWidth
              leftIcon={loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              onClick={handleNotify}
              loading={loading}
            >
              Yuborish
            </Button>
          </div>
        </div>
      ) : (
        /* Result screen */
        <div className="space-y-4">
          <div className={[
            'rounded-xl p-4 text-center',
            result.sent > 0
              ? 'bg-emerald-50 dark:bg-emerald-900/10'
              : 'bg-amber-50 dark:bg-amber-900/10',
          ].join(' ')}>
            <p className={[
              'text-3xl font-bold mb-1',
              result.sent > 0 ? 'text-emerald-600' : 'text-amber-600',
            ].join(' ')}>
              {result.sent}
            </p>
            <p className={[
              'text-sm font-semibold',
              result.sent > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
            ].join(' ')}>
              {result.sent > 0 ? 'ta ota-onaga xabar yuborildi' : 'Hech kimga yuborilmadi'}
            </p>
          </div>

          <div className="bg-[var(--bg-page)] rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Jami qarzdorlar:</span>
              <span className="font-semibold">{result.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Yuborildi:</span>
              <span className="font-bold text-emerald-600">{result.sent}</span>
            </div>
            {result.noLink > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Telegram yo'q:</span>
                <span className="font-semibold text-amber-600">{result.noLink}</span>
              </div>
            )}
          </div>

          {result.sentTo.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Xabar ketdi:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.sentTo.map((s, i) => (
                  <span key={i} className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button fullWidth onClick={onClose}>Yopish</Button>
        </div>
      )}
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function PaymentsPage() {
  const [searchParams] = useSearchParams()
  const urlFilter = searchParams.get('filter') as FilterType | null
  const initialFilter: FilterType = (urlFilter === 'due' || urlFilter === 'paid') ? urlFilter : 'all'

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonthISO())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>(initialFilter)
  const [total, setTotal] = useState(0)
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([])
  const [groupId, setGroupId] = useState('')
  const [exporting, setExporting] = useState(false)
  const [payTarget, setPayTarget] = useState<Payment | null>(null)
  const [showNotify, setShowNotify] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const f = searchParams.get('filter') as FilterType | null
    if (f === 'due' || f === 'paid') setFilter(f)
  }, [searchParams])

  useEffect(() => {
    api.get('/api/groups').then(r => setGroups(r.data.groups || [])).catch(() => { })
  }, [])

  async function load() {
    setLoading(true)
    try {
      const endpoint =
        filter === 'paid' ? '/api/payments/paid' :
          filter === 'due' ? '/api/payments/debtors' :
            '/api/payments/all'
      const res = await api.get(endpoint, {
        params: { date: month, search: search || undefined, groupId: groupId || undefined },
      })
      const items: Payment[] = res.data.items || []
      setPayments(items)
      setTotal(items.length)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [month, filter, groupId])
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t) }, [search])

  async function handleExport() {
    setExporting(true)
    try {
      const res = await api.get('/api/payments/export', {
        params: { date: month }, responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `payments-${month.slice(0, 7)}.xlsx`; a.click()
      URL.revokeObjectURL(url)
      toast.success('Yuklab olindi')
    } catch { toast.error("Excel yuklab bo'lmadi") } finally { setExporting(false) }
  }

  async function handleUnpay(p: Payment) {
    try {
      await api.patch(`/api/payments/${p.id}/unpay`)
      toast.info("To'lov qaytarildi")
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  const paidTotal = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0)
  const dueTotal = payments.filter(p => p.status === 'DUE' || p.status === 'PARTIAL')
    .reduce((s, p) => s + (Number(p.amount) - Number(p.paidAmount || 0)), 0)
  const dueCount = payments.filter(p => p.status === 'DUE' || p.status === 'PARTIAL').length

  const filterBtns: { key: FilterType; label: string; active: string }[] = [
    { key: 'all', label: 'Hammasi', active: 'bg-indigo-600 text-white border-indigo-600' },
    { key: 'paid', label: "To'langan", active: 'bg-emerald-600 text-white border-emerald-600' },
    { key: 'due', label: 'Qarzdorlar', active: 'bg-rose-600 text-white border-rose-600' },
  ]

  function rowStatus(p: Payment) {
    if (p.status === 'PAID') return { icon: <CheckCircle2 size={17} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
    if (p.status === 'PARTIAL') return { icon: <Clock size={17} className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-900/20' }
    return { icon: <XCircle size={17} className="text-rose-500" />, bg: 'bg-rose-50 dark:bg-rose-900/20' }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">To'lovlar</h1>
          <p className="page-subtitle">{total} ta yozuv</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Telegram notify — faqat qarzdorlar filtri aktiv bo'lganda */}
          {filter === 'due' && dueCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Send size={14} />}
              onClick={() => setShowNotify(true)}
            >
              Xabar
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download size={14} />}
            loading={exporting}
            onClick={handleExport}
          >
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-4">
        <input
          type="month"
          value={month.slice(0, 7)}
          onChange={e => setMonth(e.target.value + '-01')}
          className="input-base w-full"
        />
        <div className="flex gap-2">
          {filterBtns.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={[
                'flex-1 py-2 rounded-xl text-sm font-semibold border transition-all',
                filter === f.key
                  ? f.active
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-slate-300',
              ].join(' ')}
            >
              {f.label}
              {f.key === 'due' && dueCount > 0 && filter !== 'due' && (
                <span className="ml-1.5 bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {dueCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            leftIcon={<Search size={15} />}
            placeholder="Ism bo'yicha..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={groupId} onChange={e => setGroupId(e.target.value)} className="input-base">
            <option value="">Barcha guruhlar</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-3">
          <p className="text-xs text-[var(--text-muted)] mb-1">Yig'ilgan</p>
          <p className="font-bold text-emerald-600 text-lg">{formatMoney(paidTotal)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-[var(--text-muted)] mb-1">Qolgan qarz</p>
          <p className="font-bold text-rose-600 text-lg">{formatMoney(dueTotal)}</p>
        </div>
      </div>

      {/* List */}
      {loading ? <SkeletonList count={6} /> : payments.length === 0 ? (
        <div className="text-center py-14">
          <CreditCard size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] text-sm font-medium">To'lovlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => {
            const { icon, bg } = rowStatus(p)
            return (
              <div key={p.id} className="card p-3.5 flex items-center gap-3 animate-fade-in">
                <div className={['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg].join(' ')}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{p.student.name}</p>
                    {p.paidAt && p.status === 'PAID' && <p className="text-[10px] text-[var(--text-muted)]">{formatDate(p.paidAt, 'DD MMM')}</p>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{p.student.group.name} • {p.month}</p>

                  <div className="grid grid-cols-3 gap-2 mt-2 max-w-[280px]">
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)] uppercase">Jami</p>
                      <p className="text-[11px] font-semibold text-[var(--text-primary)]">{formatMoney(p.amount, '')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)] uppercase">To'landi</p>
                      <p className="text-[11px] font-semibold text-emerald-600">{formatMoney(p.paidAmount, '')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)] uppercase">Qoldi</p>
                      <p className={`text-[11px] font-bold ${Number(p.amount) - Number(p.paidAmount) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatMoney(Number(p.remainingAmount || (Number(p.amount) - Number(p.paidAmount))))}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {p.status === 'PAID' ? (
                    <button
                      onClick={() => handleUnpay(p)}
                      title="Qaytarish"
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--bg-page)] text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    >
                      <XCircle size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setPayTarget(p)}
                      className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                    >
                      {p.status === 'PARTIAL' ? 'Davom' : "To'lash"}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PayModal payment={payTarget} open={!!payTarget} onClose={() => setPayTarget(null)} onPaid={load} />

      <NotifyModal
        open={showNotify}
        onClose={() => setShowNotify(false)}
        month={month}
        dueCount={dueCount}
      />
    </div>
  )
}
