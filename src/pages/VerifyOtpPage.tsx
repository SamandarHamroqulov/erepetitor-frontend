import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Button } from '../components/ui/Button'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const email = (location.state as { email?: string })?.email || ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  function handleDigit(i: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = v
    setDigits(next)
    setError('')
    if (v && i < 5) inputRefs.current[i + 1]?.focus()
    if (next.every(d => d !== '')) {
      submitOtp(next.join(''))
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      const arr = text.split('')
      setDigits(arr)
      inputRefs.current[5]?.focus()
      submitOtp(text)
    }
  }

  async function submitOtp(code: string) {
    if (!email) { setError('Email topilmadi'); return }
    setLoading(true)
    try {
      await api.post('/api/auth/verify-otp', { email, code, purpose: 'REGISTER' })
      toast.success('Email tasdiqlandi!')
      navigate('/login')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Xatolik'
      setError(msg)
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    if (!email || resending || cooldown > 0) return
    setResending(true)
    try {
      await api.post('/api/auth/resend-otp', { email })
      toast.info('OTP qayta yuborildi')
      setCooldown(60)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Xatolik')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Tasdiqlash"
      subtitle={email ? `${email} manziliga yuborildi` : 'Emailingizni tekshiring'}
    >
      <div className="space-y-6">
        {!email && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
            Email topilmadi.{' '}
            <Link to="/register" className="font-semibold underline">Ro'yxatdan o'ting</Link>
          </div>
        )}

        {error && (
          <div className="bg-rose-900/10 dark:bg-rose-900/20 border border-rose-300 dark:border-rose-800 text-rose-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              className={[
                'w-11 h-14 text-center text-xl font-bold border-2 rounded-xl bg-white',
                'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all',
                error ? 'border-rose-400' : 'border-[var(--border-color)]',
                loading ? 'opacity-50' : '',
              ].join(' ')}
            />
          ))}
        </div>

        <Button
          fullWidth
          loading={loading}
          size="lg"
          onClick={() => submitOtp(digits.join(''))}
          disabled={digits.some(d => !d)}
        >
          Tasdiqlash
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={resend}
            disabled={resending || cooldown > 0 || !email}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Qayta yuborish (${cooldown}s)` : 'Qayta yuborish'}
          </button>
        </div>
      </div>
    </AuthShell>
  )
}
