/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react'
import { User, Lock, Camera, Eye, EyeOff, Moon, Sun, LogOut, ChevronRight, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../components/AuthContext'
import { useTheme } from '../components/ThemeContext'
import { useToast } from '../components/ui/Toast'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')

export default function ProfilePage() {
  const { teacher, refreshProfile, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const isDark = theme === 'dark'

  const [name, setName] = useState(teacher?.name || '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [showPwModal, setShowPwModal] = useState(false)

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => { if (teacher) setName(teacher.name) }, [teacher])

  async function handleSaveName(ev: React.FormEvent) {
    ev.preventDefault()
    if (!name.trim()) { setNameError('Ism kiritng'); return }
    setNameError(''); setNameLoading(true)
    try {
      await api.patch('/api/profile/me', { name: name.trim() })
      await refreshProfile()
      toast.success('Profil yangilandi')
      setShowNameModal(false)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setNameLoading(false) }
  }

  function validatePw() {
    const e: Record<string, string> = {}
    if (!pwForm.current) e.current = 'Joriy parol kiritng'
    if (!pwForm.next) e.next = 'Yangi parol kiritng'
    else if (pwForm.next.length < 6) e.next = 'Kamida 6 ta belgi'
    if (pwForm.next !== pwForm.confirm) e.confirm = 'Parollar mos emas'
    return e
  }

  async function handleChangePassword(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validatePw()
    if (Object.keys(e).length) { setPwErrors(e); return }
    setPwErrors({}); setPwLoading(true)
    try {
      await api.post('/api/profile/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next })
      toast.success('Parol yangilandi')
      setPwForm({ current: '', next: '', confirm: '' })
      setShowPwModal(false)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setPwLoading(false) }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Rasm hajmi 5MB dan oshmasin'); return }
    setAvatarUploading(true)
    try {
      const fd = new FormData(); fd.append('avatar', file)
      await api.post('/api/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshProfile()
      toast.success('Rasm yangilandi')
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally { setAvatarUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try { await logout() } finally { setLoggingOut(false) }
  }

  const [stats, setStats] = useState<{ activeStudents: number; activeGroups: number } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    async function getStats() {
      setStatsLoading(true)
      try {
        const res = await api.get('/api/dashboard/main')
        setStats({
          activeStudents: res.data.students.active,
          activeGroups: res.data.groups.active
        })
      } catch (err) {
        console.error('Stats load failed', err)
      } finally {
        setStatsLoading(false)
      }
    }
    getStats()
  }, [])

  const avatarUrl = teacher?.avatarUrl ? `${BASE_URL}${teacher.avatarUrl}` : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-2xl font-bold">Profil</h1>
          <p className="page-subtitle text-sm text-[var(--text-muted)]">Shaxsiy ma'lumotlar va sozlamalar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="card p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10" />
            <div className="relative mt-4">
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border-4 border-white dark:border-[var(--bg-card)] shadow-xl">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-indigo-600 uppercase">
                    {teacher?.name?.charAt(0) || 'T'}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95"
              >
                {avatarUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={15} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[var(--text-primary)] text-xl mb-0.5">{teacher?.name}</p>
              <p className="text-sm text-[var(--text-muted)] mb-3 truncate w-full max-w-full px-2" title={teacher?.email || ''}>{teacher?.email}</p>
              {teacher?.role === 'ADMIN' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats Block */}
          <div className="card p-5">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 px-1">Statistika</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--bg-page)] rounded-2xl border border-[var(--border-color)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">O'quvchilar</p>
                {statsLoading ? <div className="h-5 w-12 skeleton rounded-md" /> : (
                  <p className="text-lg font-bold text-[var(--text-primary)]">{stats?.activeStudents ?? 0} faol</p>
                )}
              </div>
              <div className="p-3 bg-[var(--bg-page)] rounded-2xl border border-[var(--border-color)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1">Guruhlar</p>
                {statsLoading ? <div className="h-5 w-12 skeleton rounded-md" /> : (
                  <p className="text-lg font-bold text-[var(--text-primary)]">{stats?.activeGroups ?? 0} ta</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider p-5 border-b border-[var(--border-color)]">Asosiy sozlamalar</h3>
            <div className="divide-y divide-[var(--border-color)]">
              {/* Edit name */}
              <button
                onClick={() => setShowNameModal(true)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-page)] transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <User size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Ismni o'zgartirish</p>
                  <p className="text-xs text-[var(--text-muted)]">Shaxsiy ma'lumotlarni tahrirlash</p>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Change password */}
              <button
                onClick={() => setShowPwModal(true)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-page)] transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Lock size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Parolni o'zgartirish</p>
                  <p className="text-xs text-[var(--text-muted)]">Akkaunt xavfsizligini ta'minlash</p>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Billing */}
              <Link
                to="/billing"
                className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-page)] transition-colors group"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Receipt size={18} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Obuna va To'lovlar</p>
                  <p className="text-xs text-[var(--text-muted)]">Xizmat muddati va billing</p>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="card overflow-hidden">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider p-5 border-b border-[var(--border-color)]">Tizim sozlamalari</h3>
            <div className="divide-y divide-[var(--border-color)]">
              {/* Theme toggle */}
              <button
                onClick={toggle}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-page)] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {isDark ? <Sun size={18} className="text-slate-600 dark:text-slate-300" /> : <Moon size={18} className="text-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Mavzu: {isDark ? 'Qorong\'u' : 'Yorug\''}</p>
                </div>
                <div className={[
                  'w-11 h-6 rounded-full transition-colors relative flex items-center px-1',
                  isDark ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700',
                ].join(' ')}>
                  <div className={[
                    'w-4 h-4 bg-white rounded-full shadow-lg transition-all transform',
                    isDark ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')} />
                </div>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                  <LogOut size={18} className="text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-rose-600">Chiqish</p>
                </div>
                {loggingOut && <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />}
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Edit name modal */}
      <Modal open={showNameModal} onClose={() => setShowNameModal(false)} title="Ismni o'zgartirish" size="sm">
        <form onSubmit={handleSaveName} className="space-y-4">
          <Input label="Ism familiya" value={name} onChange={e => setName(e.target.value)} error={nameError} autoFocus disabled={nameLoading} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowNameModal(false)} disabled={nameLoading}>Bekor</Button>
            <Button type="submit" fullWidth loading={nameLoading}>Saqlash</Button>
          </div>
        </form>
      </Modal>

      {/* Change password modal */}
      <Modal open={showPwModal} onClose={() => setShowPwModal(false)} title="Parolni o'zgartirish">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="Joriy parol" type={showPw ? 'text' : 'password'} value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} error={pwErrors.current} disabled={pwLoading} />
          <Input label="Yangi parol" type={showPw ? 'text' : 'password'} value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} error={pwErrors.next} disabled={pwLoading} />
          <Input label="Yangi parolni tasdiqlang" type={showPw ? 'text' : 'password'} value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} error={pwErrors.confirm} disabled={pwLoading}
            rightIcon={
              <button type="button" onClick={() => setShowPw(s => !s)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowPwModal(false)} disabled={pwLoading}>Bekor</Button>
            <Button type="submit" fullWidth loading={pwLoading}>O'zgartirish</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
