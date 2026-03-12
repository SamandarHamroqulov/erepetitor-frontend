import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CreditCard, Search, Download, CheckCircle2, XCircle, Clock } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney, formatDate, currentMonthISO } from '../lib/date'
import type { Payment } from '../types'

type FilterType = 'all' | 'paid' | 'due'

// ── Pay Modal ────────────────────────────────────────────
function PayModal({
  payment,
  open,
  onClose,
  onPaid,
}: {
  payment: Payment | null
  open: boolean
  onClose: () => void
  onPaid: () => void
}) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (open && payment) {
      const remaining = Number(payment.amount) - Number(payment.paidAmount || 0)
      setAmount(String(remaining))
      setError('')
    }
  }, [open, payment])

  async function handlePay() {
    if (!payment) return
    const val = Number(amount)
    const remaining = Number(payment.amount) - Number(payment.paidAmount || 0)
    if (!val || val <= 0) { setError('Summa kiriting'); return }
    if (val > remaining) { setError(`Maksimal: ${formatMoney(remaining)}`); return }
    setError('')
    setLoading(true)
    try {
      await api.patch(`/api/payments/${payment.id}/pay`, { payAmount: val })
      toast.success("To'lov qo'shildi!")
      onPaid()
      onClose()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally {
      setLoading(false)
    }
  }

  if (!payment) return null

  const total = Number(payment.amount)
  const paidSoFar = Number(payment.paidAmount || 0)
  const remaining = total - paidSoFar
  const progressPct = total > 0 ? Math.min(100, (paidSoFar / total) * 100) : 0

  return (
    <Modal open={open} onClose={onClose} title="To'lov qo'shish" size="sm">
      <div className="space-y-4">
        {/* Info */}
        <div className="bg-[var(--bg-page)] rounded-xl p-3 space-y-1.5">
          <p className="font-semibold text-[var(--text-primary)] text-sm">{payment.student.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">{payment.student.group.name}</p>

          <div className="flex justify-between text-xs pt-1">
            <span className="text-[var(--text-muted)]">Jami:</span>
            <span className="font-semibold text-[var(--text-primary)]">{formatMoney(total)}</span>
          </div>
          {paidSoFar > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">To'langan:</span>
              <span className="font-semibold text-emerald-500">{formatMoney(paidSoFar)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Qoldi:</span>
            <span className="font-semibold text-rose-500">{formatMoney(remaining)}</span>
          </div>

          {paidSoFar > 0 && (
            <div className="pt-1 h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>

        <Input
          label="To'lov summasi (so'm)"
          type="number"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError('') }}
          error={error}
          placeholder={String(remaining)}
          autoFocus
        />

        {/* Quick picks */}
        {remaining > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAmount(String(remaining))}
              className="flex-1 py-1.5 text-xs font-semibold border rounded-lg
                bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]
                hover:border-indigo-400 hover:text-indigo-500 transition-colors"
            >
              To'liq: {formatMoney(remaining)}
            </button>
            {remaining >= 2 && (
              <button
                type="button"
                onClick={() => setAmount(String(Math.ceil(remaining / 2)))}
                className="flex-1 py-1.5 text-xs font-semibold border rounded-lg
                  bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]
                  hover:border-indigo-400 hover:text-indigo-500 transition-colors"
              >
                Yarmi: {formatMoney(Math.ceil(remaining / 2))}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>Bekor</Button>
          <Button fullWidth loading={loading} onClick={handlePay}>To'lash</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Page ────────────────────────────────────────────
export default function PaymentsPage() {
  const [searchParams] = useSearchParams()
  const urlFilter = searchParams.get('filter') as FilterType | null
  const initialFilter: FilterType = (urlFilter === 'due' || urlFilter === 'paid') ? urlFilter : 'all'

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonthISO())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>(initialFilter)

  useEffect(() => {
    const f = searchParams.get('filter') as FilterType | null
    if (f === 'due' || f === 'paid') setFilter(f)
  }, [searchParams])
  const [total, setTotal] = useState(0)
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([])
  const [groupId, setGroupId] = useState('')
  const [exporting, setExporting] = useState(false)
  const [payTarget, setPayTarget] = useState<Payment | null>(null)
  const toast = useToast()

  useEffect(() => {
    api.get('/api/groups').then(r => setGroups(r.data.groups || [])).catch(() => {})
  }, [])

  async function load() {
    setLoading(true)
    try {
      const endpoint =
        filter === 'paid' ? '/api/payments/paid' :
        filter === 'due'  ? '/api/payments/debtors' :
                            '/api/payments/all'
      const res = await api.get(endpoint, {
        params: {
          date: month,
          search: search || undefined,
          groupId: groupId || undefined,
        },
      })
      const items: Payment[] = res.data.items || []
      setPayments(items)
      setTotal(items.length)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [month, filter, groupId])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t) }, [search])

  async function handleExport() {
    setExporting(true)
    try {
      const res = await api.get('/api/payments/export', {
        params: { date: month },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments-${month.slice(0, 7)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Yuklab olindi')
    } catch {
      toast.error("Excel yuklab bo'lmadi")
    } finally {
      setExporting(false)
    }
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

  // Summary calculations
  const paidTotal = payments
    .filter(p => p.status === 'PAID')
    .reduce((s, p) => s + Number(p.amount), 0)

  const dueTotal = payments
    .filter(p => p.status === 'DUE' || p.status === 'PARTIAL')
    .reduce((s, p) => s + (Number(p.amount) - Number(p.paidAmount || 0)), 0)

  // ── Filter buttons ───────────────────────────────────
  const filterBtns: { key: FilterType; label: string; active: string }[] = [
    { key: 'all',  label: 'Hammasi',    active: 'bg-indigo-600 text-white border-indigo-600' },
    { key: 'paid', label: "To'langan",  active: 'bg-emerald-600 text-white border-emerald-600' },
    { key: 'due',  label: 'Qarzdorlar', active: 'bg-rose-600 text-white border-rose-600' },
  ]

  // ── Per-row helpers ──────────────────────────────────
  function rowIcon(p: Payment) {
    if (p.status === 'PAID')    return <CheckCircle2 size={18} className="text-emerald-500" />
    if (p.status === 'PARTIAL') return <Clock        size={18} className="text-amber-500" />
    return                             <XCircle      size={18} className="text-rose-500" />
  }

  function rowIconBg(p: Payment) {
    if (p.status === 'PAID')    return 'bg-emerald-100 dark:bg-emerald-900/30'
    if (p.status === 'PARTIAL') return 'bg-amber-100  dark:bg-amber-900/30'
    return                             'bg-rose-100   dark:bg-rose-900/30'
  }

  function rowAmount(p: Payment) {
    if (p.status === 'PARTIAL') {
      return (
        <div className="text-right shrink-0">
          <p className="font-bold text-sm text-amber-500">{formatMoney(p.paidAmount)}</p>
          <p className="text-[11px] text-[var(--text-muted)]">/ {formatMoney(p.amount)}</p>
        </div>
      )
    }
    return (
      <div className="text-right shrink-0">
        <p className={['font-bold text-sm', p.status === 'PAID' ? 'text-emerald-500' : 'text-rose-500'].join(' ')}>
          {formatMoney(p.amount)}
        </p>
        {p.paidAt && (
          <p className="text-[11px] text-[var(--text-muted)]">{formatDate(p.paidAt)}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">To'lovlar</h1>
          <p className="page-subtitle">{total} ta yozuv</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Download size={15} />}
          loading={exporting}
          onClick={handleExport}
        >
          Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-5">
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
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-slate-400',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            leftIcon={<Search size={16} />}
            placeholder="Ism bo'yicha..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            className="input-base"
          >
            <option value="">Barcha guruhlar</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card p-3">
          <p className="text-xs text-[var(--text-muted)] mb-1">Yig'ilgan</p>
          <p className="font-bold text-emerald-500 text-lg">{formatMoney(paidTotal)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-[var(--text-muted)] mb-1">Qolgan qarz</p>
          <p className="font-bold text-rose-500 text-lg">{formatMoney(dueTotal)}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <SkeletonList count={6} />
      ) : payments.length === 0 ? (
        <div className="text-center py-14">
          <CreditCard size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] text-sm">To'lovlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="card p-4 flex items-center gap-3 animate-fade-in">

              {/* Status icon */}
              <div className={['w-9 h-9 rounded-full flex items-center justify-center shrink-0', rowIconBg(p)].join(' ')}>
                {rowIcon(p)}
              </div>

              {/* Name + group + partial bar */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                  {p.student.name}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {p.student.group.name}
                </p>
                {p.status === 'PARTIAL' && (
                  <div className="mt-1.5 h-1 bg-[var(--border-color)] rounded-full overflow-hidden w-20">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{
                        width: `${(Number(p.paidAmount) / Number(p.amount)) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Amount */}
              {rowAmount(p)}

              {/* Action button */}
              {p.status === 'PAID' ? (
                <button
                  onClick={() => handleUnpay(p)}
                  className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors
                    bg-[var(--bg-page)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
                >
                  Qaytarish
                </button>
              ) : (
                <button
                  onClick={() => setPayTarget(p)}
                  className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors
                    bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400
                    hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                >
                  {p.status === 'PARTIAL' ? 'Davom' : "To'lash"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pay modal */}
      <PayModal
        payment={payTarget}
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        onPaid={load}
      />
    </div>
  )
}
