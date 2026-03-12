/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react'
import { User, Mail, Lock, Camera, Eye, EyeOff, Save, Moon, Sun } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../components/AuthContext'
import { useTheme } from '../components/ThemeContext'
import { useToast } from '../components/ui/Toast'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { formatDate } from '../lib/date'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '')

export default function ProfilePage() {
  const { teacher, refreshProfile, logout, setTeacher } = useAuth()
  const { theme, toggle } = useTheme()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(teacher?.name || '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState('')
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => { if (teacher) setName(teacher.name) }, [teacher])

  async function handleSaveName(ev: React.FormEvent) {
    ev.preventDefault()
    if (!name.trim()) { setNameError('Ism kiritng'); return }
    setNameError(''); setNameLoading(true)
    try {
      await api.patch('/api/profile/me', { name: name.trim() })
      await refreshProfile(); toast.success('Profil yangilandi')
    } catch (err: unknown) { toast.error((err as { message?: string })?.message || 'Xatolik') }
    finally { setNameLoading(false) }
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
      toast.success('Parol yangilandi'); setPwForm({ current: '', next: '', confirm: '' })
    } catch (err: unknown) { setPwErrors({ current: (err as { message?: string })?.message || 'Xatolik' }) }
    finally { setPwLoading(false) }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // ✅ basic validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error("Faqat JPG / PNG / WEBP rasm yuklang")
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Rasm 2MB dan katta bo'lmasin")
      e.target.value = ''
      return
    }

    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)

      const res = await api.post('/api/profile/avatar', fd, {
        timeout: 60_000,
      })

      if (res.data.teacher) {
        setTeacher(res.data.teacher)
      } else {
        await refreshProfile()
      }
      toast.success('Avatar yangilandi')
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }
  const avatarUrl = teacher?.avatarUrl
    ? teacher.avatarUrl.startsWith('http')
      ? teacher.avatarUrl
      : `${BASE_URL}${teacher.avatarUrl.startsWith('/') ? '' : '/'}${teacher.avatarUrl}`
    : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Profil</h1>
        <p className="page-subtitle">Shaxsiy ma'lumotlaringiz</p>
      </div>

      {/* Avatar + info */}
      <Card padding="md">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => console.log("Avatar image failed:", avatarUrl)} />
                : <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{teacher?.name?.charAt(0).toUpperCase()}</span>
              }
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {avatarUploading
                ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={12} />}
            </button>
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)]">{teacher?.name}</p>
            <p className="text-sm text-[var(--text-secondary)]">{teacher?.email}</p>
            {teacher?.createdAt && <p className="text-xs text-[var(--text-muted)] mt-0.5">Ro'yxatdan o'tgan: {formatDate(teacher.createdAt)}</p>}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
      </Card>

      {/* Theme toggle */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[var(--text-primary)] text-sm">Interfeys temasi</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{theme === 'dark' ? 'Qorong\'u tema' : 'Yorug\' tema'}</p>
          </div>
          <button onClick={toggle}
            className={['relative w-14 h-7 rounded-full transition-all duration-300',
              theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200',
            ].join(' ')}>
            <span className={['absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm',
              theme === 'dark' ? 'left-7 bg-white text-indigo-600' : 'left-0.5 bg-white text-slate-500',
            ].join(' ')}>
              {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
            </span>
          </button>
        </div>
      </Card>

      {/* Name */}
      <Card padding="md">
        <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 text-sm">
          <User size={16} className="text-indigo-500" />Ism
        </h2>
        <form onSubmit={handleSaveName} className="space-y-3" noValidate>
          <Input label="To'liq ism" value={name} onChange={e => { setName(e.target.value); setNameError('') }} error={nameError} leftIcon={<User size={16} />} disabled={nameLoading} />
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Mail size={13} />{teacher?.email}</div>
          <Button type="submit" leftIcon={<Save size={15} />} loading={nameLoading} size="sm">Saqlash</Button>
        </form>
      </Card>

      {/* Change password */}
      <Card padding="md">
        <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 text-sm">
          <Lock size={16} className="text-indigo-500" />Parol o'zgartirish
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3" noValidate>
          <Input label="Joriy parol" type={showPw ? 'text' : 'password'} value={pwForm.current}
            onChange={e => { setPwForm(f => ({ ...f, current: e.target.value })); setPwErrors(x => ({ ...x, current: '' })) }}
            error={pwErrors.current} leftIcon={<Lock size={16} />}
            rightIcon={showPw ? <EyeOff size={16} /> : <Eye size={16} />} onRightIconClick={() => setShowPw(p => !p)} disabled={pwLoading} />
          <Input label="Yangi parol" type={showPw ? 'text' : 'password'} value={pwForm.next}
            onChange={e => { setPwForm(f => ({ ...f, next: e.target.value })); setPwErrors(x => ({ ...x, next: '' })) }}
            error={pwErrors.next} leftIcon={<Lock size={16} />} disabled={pwLoading} />
          <Input label="Yangi parolni tasdiqlang" type={showPw ? 'text' : 'password'} value={pwForm.confirm}
            onChange={e => { setPwForm(f => ({ ...f, confirm: e.target.value })); setPwErrors(x => ({ ...x, confirm: '' })) }}
            error={pwErrors.confirm} leftIcon={<Lock size={16} />} disabled={pwLoading} />
          <Button type="submit" leftIcon={<Save size={15} />} loading={pwLoading} size="sm">Parolni yangilash</Button>
        </form>
      </Card>

      <button onClick={async () => { setLoggingOut(true); try { await logout() } finally { setLoggingOut(false) } }} disabled={loggingOut}
        className="w-full py-3 rounded-xl text-rose-500 font-semibold text-sm border border-rose-200 dark:border-rose-900/50 bg-[var(--bg-card)] hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors disabled:opacity-50">
        {loggingOut ? 'Chiqilmoqda...' : 'Tizimdan chiqish'}
      </button>
    </div>
  )
}
