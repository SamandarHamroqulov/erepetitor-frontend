import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, ChevronRight, BookOpen, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { SkeletonList } from '../components/ui/Skeleton'
import type { Group } from '../types'

const DAYS = [
  { value: 'mon', label: 'Du' }, { value: 'tue', label: 'Se' },
  { value: 'wed', label: 'Chor' }, { value: 'thu', label: 'Pay' },
  { value: 'fri', label: 'Ju' }, { value: 'sat', label: 'Sha' },
  { value: 'sun', label: 'Yak' },
]

function GroupCard({ group, onDelete }: { group: Group; onDelete: (id: number) => void }) {
  return (
    <div className="card p-4 flex items-center gap-3 animate-fade-in">
      <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
        <BookOpen size={20} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--text-primary)] truncate">{group.name}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-secondary)]">
          {group.subject && <span>{group.subject}</span>}
          <span className="flex items-center gap-1">
            <Users size={11} />{group._count?.students ?? 0} o'quvchi
          </span>
          {group.time && <span>{group.time}</span>}
        </div>
        {group.days?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {group.days.map(d => (
              <span key={d} className="text-[10px] font-medium bg-[var(--bg-page)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded-md uppercase border border-[var(--border-color)]">
                {d}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onDelete(group.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          <Trash2 size={16} />
        </button>
        <Link to={`/groups/${group.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  )
}

interface CreateForm {
  name: string; subject: string; monthlyPrice: string
  days: string[]; time: string; durationMin: string
}
const INIT: CreateForm = { name: '', subject: '', monthlyPrice: '', days: [], time: '', durationMin: '90' }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>(INIT)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const toast = useToast()

  async function load() {
    try {
      const res = await api.get('/api/groups')
      setGroups(res.data.groups || [])
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function toggleDay(day: string) {
    setForm(f => ({ ...f, days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day] }))
  }

  function validateCreate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nom kiritng'
    if (!form.monthlyPrice) e.monthlyPrice = "Oylik to'lov kiritng"
    else if (isNaN(Number(form.monthlyPrice))) e.monthlyPrice = "Raqam kiritng"
    if (form.days.length > 0 && !form.time) e.time = 'Vaqt kiritng'
    return e
  }

  async function handleCreate(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validateCreate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    setFormErrors({}); setSaving(true)
    try {
      await api.post('/api/groups', {
        name: form.name.trim(), subject: form.subject.trim() || null,
        monthlyPrice: Number(form.monthlyPrice), days: form.days,
        time: form.time || null, durationMin: form.durationMin ? Number(form.durationMin) : 90,
      })
      toast.success('Guruh yaratildi!')
      setShowCreate(false); setForm(INIT); await load()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/api/groups/${id}`)
      toast.success("Guruh o'chirildi")
      setGroups(g => g.filter(x => x.id !== id))
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setDeleteId(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Guruhlar</h1>
          <p className="page-subtitle">{groups.length} ta guruh</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Guruh</Button>
      </div>

      {loading ? <SkeletonList count={4} /> : groups.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] font-medium">Guruhlar yo'q</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Birinchi guruhingizni yarating</p>
          <Button size="sm" leftIcon={<Plus size={16} />} className="mt-4" onClick={() => setShowCreate(true)}>
            Guruh yaratish
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map(g => <GroupCard key={g.id} group={g} onDelete={id => setDeleteId(id)} />)}
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFormErrors({}) }} title="Yangi guruh">
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <Input label="Guruh nomi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={formErrors.name} placeholder="Masalan: 7-sinf ingliz tili" disabled={saving} />
          <Input label="Fan (ixtiyoriy)" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Masalan: Ingliz tili" disabled={saving} />
          <Input label="Oylik to'lov (so'm)" type="number" value={form.monthlyPrice} onChange={e => setForm(f => ({ ...f, monthlyPrice: e.target.value }))} error={formErrors.monthlyPrice} placeholder="350000" disabled={saving} />
          <div>
            <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">Dars kunlari</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <button key={d.value} type="button" onClick={() => toggleDay(d.value)} disabled={saving}
                  className={['px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                    form.days.includes(d.value)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-indigo-400',
                  ].join(' ')}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          {form.days.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Vaqt" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} error={formErrors.time} disabled={saving} />
              <Input label="Davomiyligi (min)" type="number" value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))} placeholder="90" disabled={saving} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowCreate(false)} disabled={saving}>Bekor</Button>
            <Button type="submit" fullWidth loading={saving}>Yaratish</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Guruhni o'chirish">
        <p className="text-[var(--text-secondary)] text-sm mb-5">Guruhni rasman o'chirishdan oldin, unda mavjud faol o'quvchilarni boshqa guruhga ko'chirishingiz yoki guruhdan chiqarishingiz kerak bo'ladi. Davom etasizmi?</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>Bekor</Button>
          <Button variant="danger" fullWidth onClick={() => deleteId && handleDelete(deleteId)}>O'chirish</Button>
        </div>
      </Modal>
    </div>
  )
}
