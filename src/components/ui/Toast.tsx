import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

type ToastSeverity = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  severity: ToastSeverity
}

interface ToastContextValue {
  toast: (message: string, severity?: ToastSeverity) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastSeverity, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error:   <XCircle size={18} />,
  info:    <Info size={18} />,
  warning: <AlertTriangle size={18} />,
}

const STYLES: Record<ToastSeverity, string> = {
  success: 'bg-emerald-600 text-white',
  error:   'bg-rose-600 text-white',
  info:    'bg-indigo-600 text-white',
  warning: 'bg-amber-500 text-white',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto animate-slide-up',
        STYLES[toast.severity],
      ].join(' ')}
      role="alert"
    >
      <span className="shrink-0">{ICONS[toast.severity]}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-75 hover:opacity-100 transition-opacity"
        aria-label="Yopish"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, severity: ToastSeverity = 'info') => {
    const id = String(++counterRef.current)
    setToasts(prev => [...prev.slice(-4), { id, message, severity }])
  }, [])

  const ctx: ToastContextValue = {
    toast,
    success: m => toast(m, 'success'),
    error:   m => toast(m, 'error'),
    info:    m => toast(m, 'info'),
    warning: m => toast(m, 'warning'),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
