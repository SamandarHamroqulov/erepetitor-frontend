import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())     e.name    = 'Ism kiritng'
    if (!form.email.trim())    e.email   = 'Email kiritng'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email noto'g'ri"
    if (!form.password)        e.password = 'Parol kiritng'
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
      await api.post('/api/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      toast.success("OTP emailingizga yuborildi")
      navigate('/verify-otp', { state: { email: form.email.trim().toLowerCase() } })
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Xatolik'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Ro'yxatdan o'tish" subtitle="Yangi hisob yarating">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.general && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
            {errors.general}
          </div>
        )}

        <Input
          label="Ism"
          type="text"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          error={errors.name}
          leftIcon={<User size={18} />}
          placeholder="To'liq ismingiz"
          autoComplete="name"
          disabled={loading}
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          error={errors.email}
          leftIcon={<Mail size={18} />}
          placeholder="email@example.com"
          autoComplete="email"
          disabled={loading}
        />

        <Input
          label="Parol"
          type={showPw ? 'text' : 'password'}
          value={form.password}
          onChange={e => set('password', e.target.value)}
          error={errors.password}
          leftIcon={<Lock size={18} />}
          rightIcon={showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          onRightIconClick={() => setShowPw(p => !p)}
          placeholder="Kamida 6 ta belgi"
          autoComplete="new-password"
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
          autoComplete="new-password"
          disabled={loading}
        />

        <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
          Ro'yxatdan o'tish
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-5">
        Hisobingiz bormi?{' '}
        <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
          Kirish
        </Link>
      </p>
    </AuthShell>
  )
}
