import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../components/AuthContext'
import { useToast } from '../components/ui/Toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = 'Email kiritng'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email noto'g'ri"
    if (!password.trim()) e.password = 'Parol kiritng'
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Xatolik yuz berdi'

      if (msg === "Avval emailni tasdiqlang") {
        toast.error("Hisobingiz tasdiqlanmagan. Tasdiqlash saxifasiga o'tyapmiz...")
        navigate('/verify-otp', { state: { email: email.trim().toLowerCase() } })
        return
      }

      setErrors({ general: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Kirish" subtitle="Hisobingizga kiring">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.general && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
            {errors.general}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail size={18} />}
          placeholder="email@example.com"
          autoComplete="email"
          disabled={loading}
        />

        <Input
          label="Parol"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
          leftIcon={<Lock size={18} />}
          rightIcon={showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          onRightIconClick={() => setShowPw(p => !p)}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Parolni unutdingizmi?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
          Kirish
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-5">
        Hisobingiz yo'qmi?{' '}
        <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">
          Ro'yxatdan o'ting
        </Link>
      </p>
    </AuthShell>
  )
}
