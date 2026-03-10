import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!email.trim()) { setError('Email kiritng'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() })
      toast.success('OTP emailingizga yuborildi')
      navigate('/reset-password', { state: { email: email.trim().toLowerCase() } })
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Xatolik'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Parolni tiklash" subtitle="Emailingizni kiriting, OTP yuboramiz">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          error={undefined}
          leftIcon={<Mail size={18} />}
          placeholder="email@example.com"
          disabled={loading}
        />
        <Button type="submit" fullWidth loading={loading} size="lg">
          OTP yuborish
        </Button>
      </form>
      <p className="text-center text-sm text-[var(--text-secondary)] mt-5">
        <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
          ← Kirish sahifasiga qaytish
        </Link>
      </p>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const email = (location.state as { email?: string })?.email || ''

  const [form, setForm] = useState({ code: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.code.trim() || form.code.length < 4) e.code = 'OTP kiritng'
    if (!form.password) e.password = 'Yangi parol kiritng'
    else if (form.password.length < 6) e.password = 'Kamida 6 ta belgi'
    if (form.password !== form.confirm) e.confirm = 'Parollar mos emas'
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', {
        email,
        code: form.code.trim(),
        newPassword: form.password,
      })
      toast.success('Parol yangilandi!')
      navigate('/login')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Xatolik'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Yangi parol" subtitle={email || 'OTP va yangi parolni kiriting'}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.general && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
            {errors.general}
          </div>
        )}
        <Input
          label="OTP kodi"
          type="text"
          inputMode="numeric"
          value={form.code}
          onChange={e => set('code', e.target.value)}
          error={errors.code}
          placeholder="123456"
          maxLength={6}
          disabled={loading}
        />
        <Input
          label="Yangi parol"
          type={showPw ? 'text' : 'password'}
          value={form.password}
          onChange={e => set('password', e.target.value)}
          error={errors.password}
          leftIcon={<Lock size={18} />}
          rightIcon={showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          onRightIconClick={() => setShowPw(p => !p)}
          placeholder="Kamida 6 ta belgi"
          disabled={loading}
        />
        <Input
          label="Parolni tasdiqlang"
          type={showPw ? 'text' : 'password'}
          value={form.confirm}
          onChange={e => set('confirm', e.target.value)}
          error={errors.confirm}
          leftIcon={<Lock size={18} />}
          placeholder="Parolni takrorlang"
          disabled={loading}
        />
        <Button type="submit" fullWidth loading={loading} size="lg">
          Parolni yangilash
        </Button>
      </form>
    </AuthShell>
  )
}
