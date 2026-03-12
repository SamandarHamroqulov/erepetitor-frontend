/// <reference types="vite/client" />
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Backend mounts routes under /api on PORT (default 4000)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  withCredentials: true,
})

// ── Token store ─────────────────────────────────────────
let accessToken: string | null = localStorage.getItem('accessToken')

export function setAccessToken(token: string | null) {
  accessToken = token
  if (token) localStorage.setItem('accessToken', token)
  else localStorage.removeItem('accessToken')
}

export function getAccessToken() {
  return accessToken
}

// ── Refresh state ────────────────────────────────────────
let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function onRefreshDone(token: string | null) {
  refreshQueue.forEach(cb => cb(token))
  refreshQueue = []
}

async function doRefresh(): Promise<string | null> {
  const res = await axios.post(
    `${BASE_URL}/api/auth/refresh`,
    {},
    { withCredentials: true, timeout: 10_000 }
  )
  const token: string = res.data.accessToken
  setAccessToken(token)
  return token
}

// ── Request interceptor: attach access token ─────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ── Response interceptor: handle 401 / timeout ───────────
api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const originalReq = error.config as InternalAxiosRequestConfig & { _retried?: boolean }

    // Network error / timeout when offline
    if (!error.response) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
      return Promise.reject({
        message: isOffline ? 'offline' : 'Ulanish xatoligi. Qayta urinib ko\'ring.',
        isNetwork: true,
        isOffline,
      })
    }

    // Subscription expired (backend: 402 + code SUBSCRIPTION_EXPIRED)
    if (error.response.status === 402) {
      const data = error.response.data as { message?: string; code?: string }
      if (data?.code === 'SUBSCRIPTION_EXPIRED') {
        window.dispatchEvent(new Event('subscription:expired'))
      }
    }

    // 401 handling: refresh once then retry
    if (
      error.response &&
      error.response.status === 401 &&
      !originalReq._retried &&
      originalReq.url !== '/api/auth/refresh' &&
      originalReq.url !== '/api/auth/login'
    ) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          refreshQueue.push(token => {
            if (token) {
              originalReq.headers.Authorization = `Bearer ${token}`
              resolve(api(originalReq))
            } else {
              reject(error)
            }
          })
        })
      }

      originalReq._retried = true
      isRefreshing = true

      try {
        const newToken = await doRefresh()
        isRefreshing = false
        onRefreshDone(newToken)
        if (newToken) {
          originalReq.headers.Authorization = `Bearer ${newToken}`
          return api(originalReq)
        }
      } catch (err) {
        isRefreshing = false
        onRefreshDone(null)
        // Refresh failed → clear and redirect
        setAccessToken(null)
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject({ message: 'Sessiya tugadi. Qayta kiring.' })
      }
    }

    // Propagate server error message
    const msg = (error.response?.data as { message?: string })?.message || 'Server xatoligi'
    return Promise.reject({ message: msg, status: error.response?.status, data: error.response?.data })
  }
)

export default api
