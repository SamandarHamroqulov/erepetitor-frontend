import { useEffect, useState } from 'react'
import {
  Shield, CheckCircle2, XCircle, Clock, User, Mail, Receipt,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney, formatDate } from '../lib/date'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')

function getReceiptUrl(url: string | null) {
  if (!url) return null;
  const str = String(url);
  if (str.startsWith('http')) return str;
  return `${BASE_URL}${str.startsWith('/') ? '' : '/'}${str}`;
}

interface PendingPayment {
  id: number
  teacherId: number
  amount: string | number
  months: number
  status: string
  proofUrl: string | null
  note: string | null
  createdAt: string
  teacher: { name: string; email: string }
}

export default function AdminBillingPage() {
  const [items, setItems] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const toast = useToast()

  async function load() {
    try {
      const res = await api.get('/api/billing/admin/pending')
      setItems(res.data.items || [])
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      toast.error(msg || "Yuklab bo'lmadi")
      if ((err as { status?: number })?.status === 403) {
        // Redirect handled by AdminRoute, but could navigate
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleConfirm(id: number) {
    setProcessing(true)
    try {
      await api.post(`/api/billing/${id}/confirm`)
      toast.success('Tasdiqlandi')
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!rejectModal) return
    setProcessing(true)
    try {
      await api.post(`/api/billing/${rejectModal.id}/reject`, {
        rejectReason: rejectReason.trim() || undefined,
      })
      toast.info('Rad etildi')
      setRejectModal(null)
      setRejectReason('')
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="pt-4"><SkeletonList count={5} /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="page-title">Admin · To'lovlar</h1>
          <p className="page-subtitle">Ko'rib chiqish kutilayotgan to'lovlar</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
          <p className="font-medium text-[var(--text-primary)]">Kutilayotgan to'lovlar yo'q</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Barcha to'lovlar ko'rib chiqilgan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={16} className="text-[var(--text-muted)] shrink-0" />
                    <p className="font-semibold text-[var(--text-primary)]">{p.teacher.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Mail size={14} />
                    {p.teacher.email}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <Receipt size={14} className="text-indigo-500" />
                    <span className="font-bold text-indigo-600">{formatMoney(p.amount)}</span>
                    <span className="text-[var(--text-muted)]">· {p.months} oy</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                    <Clock size={12} /> {formatDate(p.createdAt)}
                  </p>
                  {p.note && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2 bg-[var(--bg-page)] px-2 py-1 rounded">
                      {p.note}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row shrink-0">
                  {p.proofUrl && (
                    <button
                      onClick={() => setPreviewUrl(getReceiptUrl(p.proofUrl))}
                      className="text-sm text-indigo-600 hover:underline text-left"
                    >
                      Chek ko'rish
                    </button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<XCircle size={14} />}
                      onClick={() => setRejectModal({ id: p.id, name: p.teacher.name })}
                      disabled={processing}
                    >
                      Rad etish
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<CheckCircle2 size={14} />}
                      onClick={() => handleConfirm(p.id)}
                      disabled={!p.proofUrl || processing}
                      title={!p.proofUrl ? "Chek yuklanmagan" : undefined}
                    >
                      Tasdiqlash
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => { setRejectModal(null); setRejectReason('') }}
        title="To'lovni rad etish"
      >
        <div className="space-y-4">
          {rejectModal && (
            <p className="text-sm text-[var(--text-secondary)]">
              <strong>{rejectModal.name}</strong> ning to'lovini rad etishni tasdiqlaysizmi?
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Sabab (ixtiyoriy)
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="input-base w-full min-h-[80px]"
              placeholder="Rad etish sababi..."
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => { setRejectModal(null); setRejectReason('') }}>
              Bekor
            </Button>
            <Button variant="danger" fullWidth loading={processing} onClick={handleReject}>
              Rad etish
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal
        open={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="To'lov cheki"
      >
        <div className="flex flex-col items-center justify-center p-2 min-h-[200px]">
          {previewUrl ? (
            previewUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={previewUrl}
                className="w-full h-[60vh] rounded border border-slate-200"
                title="Chek PDF"
              />
            ) : (
              <img
                src={previewUrl}
                alt="To'lov cheki"
                className="max-w-full max-h-[70vh] rounded shadow-sm object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'text-sm text-rose-500 font-medium p-4 bg-rose-50 rounded-lg text-center w-full';
                    fallback.innerText = "Chek fayli topilmadi yoki noto'g'ri format";
                    parent.appendChild(fallback);
                  }
                }}
              />
            )
          ) : (
            <div className="text-sm text-[var(--text-secondary)]">
              Chek URL mavjud emas.
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
