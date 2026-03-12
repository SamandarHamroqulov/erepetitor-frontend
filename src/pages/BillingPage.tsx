import { useEffect, useRef, useState } from 'react'
import {
  Receipt, CheckCircle2, Clock, AlertTriangle,
  XCircle, Upload, CreditCard, Calendar, Copy,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatDate, formatMoney } from '../lib/date'
import dayjs from '../lib/date'
import type { BillingMeResponse, BillingPayment } from '../types'

type SubStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED'

function SubBadge({ status }: { status: SubStatus }) {
  const cfg: Record<SubStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    TRIAL: { label: 'Sinov muddati', cls: 'bg-amber-50 text-amber-600 dark:text-amber-400 border-amber-200', icon: <Clock size={14} /> },
    ACTIVE: { label: 'Faol', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    EXPIRED: { label: 'Muddati tugagan', cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: <XCircle size={14} /> },
    BLOCKED: { label: "To'xtatilgan", cls: 'bg-slate-100 text-[var(--text-secondary)] border-[var(--border-color)]', icon: <AlertTriangle size={14} /> },
  }
  const { label, cls, icon } = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${cls}`}>
      {icon}{label}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === 'CONFIRMED') return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Tasdiqlandi</span>
  if (status === 'REJECTED') return <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">Rad etildi</span>
  return <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 px-2 py-0.5 rounded-full">Kutilmoqda</span>
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingMeResponse | null>(null)
  const [payments, setPayments] = useState<BillingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [months, setMonths] = useState(1)
  const [creating, setCreating] = useState(false)

  const [uploadPaymentId, setUploadPaymentId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      const [me, hist] = await Promise.all([
        api.get('/api/billing/me'),
        api.get('/api/billing/my-payments'),
      ])
      setBillingData(me.data)
      setPayments(hist.data.payments || [])
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Yuklab bo\'lmadi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreatePayment() {
    if (!billingData) return
    setCreating(true)
    try {
      const amount = billingData.pricing.monthlyPrice * months
      await api.post('/api/billing/create', { months, amount })
      toast.success("To'lov yaratildi. Chek yuklang.")
      setShowCreate(false)
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally {
      setCreating(false)
    }
  }

  async function handleUploadProof(paymentId: number, file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/api/billing/${paymentId}/proof`, fd)
      toast.success('Chek yuklandi!')
      setUploadPaymentId(null)
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally {
      setUploading(false)
    }
  }

  function copyCard(num: string) {
    navigator.clipboard.writeText(num.replace(/\s/g, ''))
    toast.success('Karta raqami nusxalandi')
  }

  if (loading) return <div><SkeletonList count={4} /></div>
  if (!billingData) return null

  const { subscription: sub, pricing, payInfo } = billingData
  const daysLeft = sub?.currentPeriodEndsAt
    ? Math.max(0, dayjs(sub.currentPeriodEndsAt).diff(dayjs(), 'day'))
    : sub?.trialEndsAt
      ? Math.max(0, dayjs(sub.trialEndsAt).diff(dayjs(), 'day'))
      : 0

  const pendingPayment = payments.find(p => p.status === 'PENDING')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Obuna</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Obuna holati va to'lovlar</p>
      </div>

      {/* Subscription status */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2 font-medium uppercase tracking-wide">Holati</p>
            <SubBadge status={(sub?.status || 'EXPIRED') as SubStatus} />
          </div>
          <Receipt size={28} className="text-indigo-300" />
        </div>

        {sub?.currentPeriodEndsAt && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-3">
            <Calendar size={14} />
            <span>
              Muddati: <strong>{formatDate(sub.currentPeriodEndsAt)}</strong>
              {daysLeft > 0 && (
                <span className={`ml-2 font-semibold ${daysLeft < 7 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ({daysLeft} kun)
                </span>
              )}
            </span>
          </div>
        )}

        {sub?.trialEndsAt && sub.status === 'TRIAL' && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-3">
            <Clock size={14} />
            <span>
              Sinov tugaydi: <strong>{formatDate(sub.trialEndsAt)}</strong>
              {daysLeft > 0 && <span className="ml-2 font-semibold text-amber-600">({daysLeft} kun)</span>}
            </span>
          </div>
        )}
      </div>

      {/* Payment card info */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">To'lov ma'lumotlari</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Karta raqami</p>
              <p className="font-mono font-bold text-[var(--text-primary)]">{payInfo.cardNumber}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Egasi</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{payInfo.cardOwner}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Bank</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{payInfo.bankName}</p>
            </div>
          </div>
          <div className="pt-1 border-t border-slate-100 mt-2">
            <p className="text-xs text-[var(--text-secondary)]">Oylik narxi</p>
            <p className="text-lg font-bold text-indigo-600">{formatMoney(pricing.monthlyPrice)}</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      {!pendingPayment ? (
        <Button fullWidth size="lg" leftIcon={<CreditCard size={18} />} onClick={() => setShowCreate(true)}>
          To'lov yaratish
        </Button>
      ) : (
        <div className="card p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3 mb-3">
            <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-600 dark:text-amber-400 dark:text-amber-400 text-sm">To'lovingiz ko'rib chiqilmoqda</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {formatMoney(pendingPayment.amount)} · {pendingPayment.months} oy
              </p>
            </div>
          </div>
          {!pendingPayment.proofUrl ? (
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Upload size={14} />}
              onClick={() => setUploadPaymentId(pendingPayment.id)}
              fullWidth
            >
              Chek yuklash
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 size={14} />
              Chek yuklandi. Tasdiqlanishini kuting.
            </div>
          )}
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div>
          <h2 className="font-bold text-[var(--text-primary)] mb-3">To'lovlar tarixi</h2>
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{formatMoney(p.amount)}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{p.months} oy · {formatDate(p.createdAt)}</p>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </div>
                {p.rejectReason && (
                  <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg mt-2">
                    Sabab: {p.rejectReason}
                  </p>
                )}
                {p.status === 'PENDING' && !p.proofUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Upload size={13} />}
                    onClick={() => setUploadPaymentId(p.id)}
                    className="mt-2"
                  >
                    Chek yuklash
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create payment modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="To'lov yaratish">
        <div className="space-y-5">
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Necha oy uchun to'lamoqchisiz?</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 6, 12].map(m => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={[
                    'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                    months === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-indigo-300',
                  ].join(' ')}
                >
                  {m} oy
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-page)] rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{months} oy × {formatMoney(pricing.monthlyPrice)}</span>
              <span className="font-bold text-[var(--text-primary)]">{formatMoney(pricing.monthlyPrice * months)}</span>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-800">
            <p className="font-semibold mb-2">Qanday to'lash:</p>
            <div className="mb-2">
              <p className="mb-1">1. Quyidagi hisobga pul o'tkazing:</p>
              <div className="bg-white rounded-lg p-3 border border-indigo-100 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-mono font-bold text-lg text-indigo-900 tracking-wide">{payInfo.cardNumberFull}</p>
                  <p className="text-xs text-indigo-600 mt-1">{payInfo.cardOwner} • {payInfo.bankName}</p>
                </div>
                <button
                  onClick={() => copyCard(payInfo.cardNumberFull)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                  title="Nusxa olish"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <p className="mt-2">2. Chek rasmini yuklang</p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowCreate(false)}>Bekor</Button>
            <Button fullWidth loading={creating} onClick={handleCreatePayment}>To'lov yaratish</Button>
          </div>
        </div>
      </Modal>

      {/* Upload proof modal */}
      <Modal open={uploadPaymentId !== null} onClose={() => setUploadPaymentId(null)} title="Chek yuklash">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">JPG, PNG yoki WEBP format, max 6MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file && uploadPaymentId) handleUploadProof(uploadPaymentId, file)
            }}
          />
          <Button
            fullWidth
            leftIcon={<Upload size={16} />}
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Fayl tanlash
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setUploadPaymentId(null)}>Bekor</Button>
        </div>
      </Modal>
    </div>
  )
}
