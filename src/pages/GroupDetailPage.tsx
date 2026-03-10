import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Plus, CheckCircle2, XCircle, UserPlus,
  Phone, MoreVertical, CreditCard, BookOpen, Users,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney, currentMonthISO } from '../lib/date'
import dayjs from '../lib/date'
import type { Group, StudentWithPayment, PaymentsSummary } from '../types'

interface GroupDetailData {
  month: string
  group: Group
  schedule: Array<{ id: number; weekday: string; startTime: string; durationMin: number }>
  students: StudentWithPayment[]
  paymentsSummary: PaymentsSummary
}

function StudentRow({
  student,
  onPay,
  onUnpay,
  onDelete,
}: {
  student: StudentWithPayment
  onPay: (s: StudentWithPayment) => void
  onUnpay: (s: StudentWithPayment) => void
  onDelete: (s: StudentWithPayment) => void
}) {
  const p = student.paymentThisMonth
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={[
      'flex items-center gap-3 px-4 py-3 transition-colors',
      !student.isActive ? 'opacity-50' : '',
    ].join(' ')}>
      <div className="w-9 h-9 rounded-full bg-[var(--bg-page)] flex items-center justify-center shrink-0 text-sm font-bold text-[var(--text-secondary)]">
        {student.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[var(--text-primary)] text-sm truncate">{student.name}</p>
          {!student.isActive && (
            <span className="text-[10px] bg-[var(--bg-page)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded-full font-medium shrink-0">
              Nofaol
            </span>
          )}
        </div>
        {student.parentPhone && (
          <a href={`tel:${student.parentPhone}`} className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-indigo-600 transition-colors mt-0.5">
            <Phone size={11} />
            {student.parentPhone}
          </a>
        )}
      </div>

      {/* Payment badge */}
      <div className="shrink-0">
        {p ? (
          p.status === 'PAID' ? (
            <button
              onClick={() => onUnpay(student)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
              title="Qaytarish"
            >
              <CheckCircle2 size={13} />
              {formatMoney(p.amount, '')}
            </button>
          ) : (
            <button
              onClick={() => onPay(student)}
              className="flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
              title="To'landi"
            >
              <XCircle size={13} />
              To'lash
            </button>
          )
        ) : (
          <button
            onClick={() => onPay(student)}
            className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-page)] px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            To'lov yo'q
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(m => !m)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)] transition-colors"
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-9 z-20 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 min-w-[140px]">
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-page)] transition-colors"
              onClick={() => { /* maybe open transfer modal */ setMenuOpen(false) }}
            >
              Tahrirlash / Ko'chirish
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
              onClick={() => { onDelete(student); setMenuOpen(false) }}
            >
              Guruhdan chiqarish
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [data, setData] = useState<GroupDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonthISO())

  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)
  const [nameError, setNameError] = useState('')

  const [deleteStudent, setDeleteStudent] = useState<StudentWithPayment | null>(null)
  const [showBulkRemove, setShowBulkRemove] = useState(false)
  const [showBulkMove, setShowBulkMove] = useState(false)
  const [targetGroupId, setTargetGroupId] = useState('')
  const [showEditGroup, setShowEditGroup] = useState(false)

  // Edit group state
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editSubject, setEditSubject] = useState('')

  // Available groups for move
  const [allGroups, setAllGroups] = useState<Group[]>([])

  async function load(dateStr = month) {
    try {
      const res = await api.get(`/api/groups/${id}/overview`, { params: { month: dateStr.slice(0, 7) } })
      setData(res.data)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Yuklab bo\'lmadi')
      navigate('/groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    api.get('/api/groups').then(res => setAllGroups(res.data.groups || [])).catch(() => { })
  }, [id])

  async function createMonthPayments() {
    try {
      await api.post('/api/payments/create-month', { groupId: Number(id), date: month })
      toast.success("Oylik to'lovlar yaratildi")
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function handlePay(student: StudentWithPayment) {
    const p = student.paymentThisMonth
    if (!p) {
      // create payment first
      try {
        await api.post('/api/payments/create-one', { studentId: student.id, date: month })
        const res2 = await api.get(`/api/groups/${id}/overview`, { params: { month: month.slice(0, 7) } })
        const s2 = res2.data.students.find((s: StudentWithPayment) => s.id === student.id)
        if (s2?.paymentThisMonth) {
          const pp = s2.paymentThisMonth
          const remaining = Math.max(0, Number(pp.amount) - Number((pp as { paidAmount?: string | number }).paidAmount || 0))
          if (remaining > 0) {
            await api.patch(`/api/payments/${pp.id}/pay`, { payAmount: remaining })
          }
        }
        toast.success("To'landi!")
        await load()
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message || 'Xatolik')
      }
      return
    }
    try {
      const remaining = Math.max(0, Number(p.amount) - Number((p as { paidAmount?: string | number }).paidAmount || 0))
      if (remaining <= 0) {
        toast.info("To'lov allaqachon yopilgan")
        return
      }
      await api.patch(`/api/payments/${p.id}/pay`, { payAmount: remaining })
      toast.success("To'landi!")
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function handleUnpay(student: StudentWithPayment) {
    const p = student.paymentThisMonth
    if (!p) return
    try {
      await api.patch(`/api/payments/${p.id}/unpay`)
      toast.info("To'lov qaytarildi")
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function handleAddStudent(ev: React.FormEvent) {
    ev.preventDefault()
    if (!newName.trim()) { setNameError('Ism kiritng'); return }
    setNameError('')
    setAddingStudent(true)
    try {
      await api.post('/api/students', {
        name: newName.trim(),
        parentPhone: newPhone.trim() || null,
        groupId: Number(id),
      })
      toast.success("O'quvchi qo'shildi!")
      setNewName(''); setNewPhone('')
      setShowAddStudent(false)
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally {
      setAddingStudent(false)
    }
  }

  async function handleDeleteStudent(student: StudentWithPayment) {
    try {
      await api.delete(`/api/students/${student.id}`)
      toast.success("O'quvchi guruhdan chiqarildi")
      setDeleteStudent(null)
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function handleBulkRemove() {
    try {
      await api.post(`/api/groups/${id}/students/remove`)
      toast.success("Barcha o'quvchilar guruhdan chiqarildi")
      setShowBulkRemove(false)
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function handleBulkMove() {
    if (!targetGroupId) return toast.error("Guruhni tanlang")
    try {
      await api.post(`/api/groups/${id}/students/move`, { targetGroupId: Number(targetGroupId) })
      toast.success("O'quvchilar boshqa guruhga o'tkazildi")
      setShowBulkMove(false)
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  async function handleEditGroup(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.put(`/api/groups/${id}`, {
        name: editName,
        monthlyPrice: editPrice,
        time: editTime || undefined,
        subject: editSubject || undefined
      })
      toast.success("Guruh muvaffaqiyatli yangilandi")
      setShowEditGroup(false)
      await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    }
  }

  function openEditModal() {
    if (data?.group) {
      setEditName(data.group.name)
      setEditPrice(String(data.group.monthlyPrice))
      setEditTime(data.group.time || '')
      setEditSubject(data.group.subject || '')
      setShowEditGroup(true)
    }
  }

  if (loading) return <div className="pt-8"><SkeletonList count={5} /></div>
  if (!data) return null

  const { group, students, paymentsSummary: ps } = data
  const activeStudents = students.filter(s => s.isActive)
  const paidCount = ps.counts.paid
  const dueCount = ps.counts.due

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/groups')} className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-slate-200 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">{group.name}</h1>
          {group.subject && <p className="text-sm text-[var(--text-secondary)]">{group.subject}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={openEditModal}>
          Tahrirlash
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <div className="flex items-center justify-center mb-1"><Users size={16} className="text-indigo-500" /></div>
          <p className="text-xl font-bold text-[var(--text-primary)]">{activeStudents.length}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">O'quvchi</p>
        </div>
        <div className="card p-3 text-center">
          <div className="flex items-center justify-center mb-1"><CheckCircle2 size={16} className="text-emerald-500" /></div>
          <p className="text-xl font-bold text-[var(--text-primary)]">{paidCount}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">To'lagan</p>
        </div>
        <div className="card p-3 text-center">
          <div className="flex items-center justify-center mb-1"><XCircle size={16} className="text-rose-500" /></div>
          <p className="text-xl font-bold text-[var(--text-primary)]">{dueCount}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Qarzdor</p>
        </div>
      </div>

      {/* Month selector + actions */}
      <div className="flex items-center gap-3">
        <input
          type="month"
          value={month.slice(0, 7)}
          onChange={e => {
            const newMonth = e.target.value + '-01'
            setMonth(newMonth)
            load(newMonth)
          }}
          className="input-base flex-1"
        />
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<CreditCard size={15} />}
          onClick={createMonthPayments}
        >
          Oylik
        </Button>
      </div>

      {/* Summary */}
      {(paidCount > 0 || dueCount > 0) && (
        <div className="card p-4">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-[var(--text-secondary)] text-xs mb-0.5">Yig'ilgan</p>
              <p className="font-bold text-emerald-600">{formatMoney(ps.sums.paid)}</p>
            </div>
            <div className="text-right">
              <p className="text-[var(--text-secondary)] text-xs mb-0.5">Kutilmoqda</p>
              <p className="font-bold text-rose-600">{formatMoney(ps.sums.due)}</p>
            </div>
          </div>
          {ps.counts.total > 0 && (
            <div className="mt-3 h-2 bg-[var(--bg-page)] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(paidCount / ps.counts.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Students */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[var(--text-primary)]">O'quvchilar</h2>
          <div className="flex gap-2">
            {students.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
                <Button size="sm" variant="secondary" onClick={() => setShowBulkMove(true)}>Ko'chirish</Button>
                <Button size="sm" variant="secondary" className="text-amber-600 hover:bg-amber-50" onClick={() => setShowBulkRemove(true)}>Tozalash</Button>
              </div>
            )}
            <Button size="sm" variant="secondary" leftIcon={<UserPlus size={15} />} onClick={() => setShowAddStudent(true)}>
              Qo'shish
            </Button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-10">
            <Users size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-[var(--text-secondary)] text-sm">O'quvchi yo'q</p>
            <Button size="sm" leftIcon={<Plus size={15} />} className="mt-3" onClick={() => setShowAddStudent(true)}>
              Qo'shish
            </Button>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {students.map(s => (
              <StudentRow
                key={s.id}
                student={s}
                onPay={handlePay}
                onUnpay={handleUnpay}
                onDelete={s => setDeleteStudent(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add student modal */}
      <Modal open={showAddStudent} onClose={() => { setShowAddStudent(false); setNameError('') }} title="O'quvchi qo'shish">
        <form onSubmit={handleAddStudent} className="space-y-4" noValidate>
          <Input
            label="Ism"
            value={newName}
            onChange={e => { setNewName(e.target.value); setNameError('') }}
            error={nameError}
            placeholder="O'quvchi ismi"
            disabled={addingStudent}
            autoFocus
          />
          <Input
            label="Ota-ona telefon (ixtiyoriy)"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            placeholder="+998901234567"
            disabled={addingStudent}
          />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowAddStudent(false)} disabled={addingStudent}>
              Bekor
            </Button>
            <Button type="submit" fullWidth loading={addingStudent}>
              Qo'shish
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete student confirm */}
      <Modal open={!!deleteStudent} onClose={() => setDeleteStudent(null)} title="O'quvchini guruhdan chiqarish">
        <p className="text-[var(--text-secondary)] text-sm mb-5">
          <strong>{deleteStudent?.name}</strong> guruhdan chiqarilsa to'lov tarixi yo'qolmaydi, faqat guruhsiz holatga o'tadi. Tasdiqlaysizmi?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteStudent(null)}>Bekor</Button>
          <Button variant="danger" fullWidth onClick={() => deleteStudent && handleDeleteStudent(deleteStudent)}>
            Chiqarish
          </Button>
        </div>
      </Modal>

      {/* Bulk Remove Confirm */}
      <Modal open={showBulkRemove} onClose={() => setShowBulkRemove(false)} title="Guruhni tozalash">
        <p className="text-[var(--text-secondary)] text-sm mb-5">
          Guruhdagi barcha o'quvchilar chiqarib yuboriladi. Ular arxivlanmaydi. Tasdiqlaysizmi?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowBulkRemove(false)}>Bekor</Button>
          <Button variant="danger" fullWidth onClick={handleBulkRemove}>Chiqarish</Button>
        </div>
      </Modal>

      {/* Bulk Move Modal */}
      <Modal open={showBulkMove} onClose={() => setShowBulkMove(false)} title="O'quvchilarni ko'chirish">
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)] text-sm">Guruhdagi barcha faol o'quvchilarni boshqa guruhga o'tkazish:</p>
          <select
            className="input-base w-full"
            value={targetGroupId}
            onChange={e => setTargetGroupId(e.target.value)}
          >
            <option value="">Guruhni tanlang...</option>
            {allGroups.filter(g => g.id !== Number(id)).map(g => (
              <option key={g.id} value={g.id}>{g.name} ({formatMoney(g.monthlyPrice, '')})</option>
            ))}
          </select>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowBulkMove(false)}>Bekor</Button>
            <Button fullWidth onClick={handleBulkMove}>Ko'chirish</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Group Modal */}
      <Modal open={showEditGroup} onClose={() => setShowEditGroup(false)} title="Guruhni tahrirlash">
        <form onSubmit={handleEditGroup} className="space-y-4">
          <Input label="Guruh nomi" value={editName} onChange={e => setEditName(e.target.value)} required />
          <Input label="Fan (ixtiyoriy)" value={editSubject} onChange={e => setEditSubject(e.target.value)} />
          <Input label="Oylik to'lov" type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} required />
          <Input label="Dars vaqti (Masalan: 14:00)" value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="HH:MM" />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowEditGroup(false)}>Bekor</Button>
            <Button type="submit" fullWidth>Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
