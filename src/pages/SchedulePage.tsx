import { useEffect, useState } from 'react'
import { Clock, ChevronRight, CalendarDays, List } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { SkeletonList } from '../components/ui/Skeleton'
import { WEEKDAY_FULL, WEEKDAY_LABELS } from '../lib/date'
import dayjs from '../lib/date'
import type { NextLesson } from '../types'

// Hafta kunlari tartibi (Dushanba birinchi)
const WEEK_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const DAY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  MON: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  TUE: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  WED: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  THU: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
  FRI: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  SAT: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  SUN: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
}

// Dars davomiyligi ni soat:daqiqa ko'rinishida
function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h} soat`
}

// Tugash vaqtini hisoblash
function endTime(start: string, durationMin: number) {
  const [h, m] = start.split(':').map(Number)
  const totalMin = h * 60 + m + durationMin
  const eh = Math.floor(totalMin / 60) % 24
  const em = totalMin % 60
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
}

// ── Haftalik ko'rinish ─────────────────────────────────────
function WeeklyView({ lessons }: { lessons: NextLesson[] }) {
  const todayWeekday = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()]

  // Kun bo'yicha guruhlash
  const byDay: Record<string, NextLesson[]> = {}
  for (const day of WEEK_ORDER) byDay[day] = []
  for (const l of lessons) {
    if (byDay[l.weekday]) byDay[l.weekday].push(l)
  }
  // Har kunni vaqt bo'yicha sort
  for (const day of WEEK_ORDER) {
    byDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const activeDays = WEEK_ORDER.filter(d => byDay[d].length > 0)

  if (activeDays.length === 0) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mx-auto mb-4">
        <CalendarDays size={28} className="text-[var(--text-muted)]" />
      </div>
      <p className="text-[var(--text-secondary)] font-semibold mb-1">Jadval yo'q</p>
      <p className="text-sm text-[var(--text-muted)]">Guruhlar uchun jadval qo'shing</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {WEEK_ORDER.filter(d => byDay[d].length > 0).map(day => {
        const isToday = day === todayWeekday
        const colors = DAY_COLORS[day]
        const dayLessons = byDay[day]

        return (
          <div key={day} className={[
            'card overflow-hidden',
            isToday ? 'ring-2 ring-indigo-500/30' : '',
          ].join(' ')}>
            {/* Day header */}
            <div className={['flex items-center justify-between px-4 py-2.5', colors.bg].join(' ')}>
              <div className="flex items-center gap-2">
                <div className={['w-2 h-2 rounded-full', colors.dot].join(' ')} />
                <span className={['text-sm font-bold', colors.text].join(' ')}>
                  {WEEKDAY_FULL[day]}
                </span>
                {isToday && (
                  <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                    Bugun
                  </span>
                )}
              </div>
              <span className={['text-xs font-semibold', colors.text].join(' ')}>
                {dayLessons.length} ta dars
              </span>
            </div>

            {/* Lessons */}
            <div className="divide-y divide-[var(--border-color)]">
              {dayLessons.map((l, i) => (
                <Link
                  key={`${l.groupId}-${i}`}
                  to={`/groups/${l.groupId}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-page)] transition-colors group"
                >
                  {/* Time block */}
                  <div className="shrink-0 text-center w-14">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{l.startTime}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{endTime(l.startTime, l.durationMin)}</p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-8 bg-[var(--border-color)] shrink-0" />

                  {/* Group info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] text-sm truncate">
                      {l.groupName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={11} className="text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatDuration(l.durationMin)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Ro'yxat ko'rinishi ─────────────────────────────────────
function ListView({ lessons }: { lessons: NextLesson[] }) {
  const today = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')

  // nextAt bo'yicha sort (allaqachon sorted lekin ishonch uchun)
  const sorted = [...lessons].sort((a, b) => a.nextAt.localeCompare(b.nextAt))

  // Sana bo'yicha guruhlash
  const byDate: Record<string, NextLesson[]> = {}
  for (const l of sorted) {
    const date = dayjs(l.nextAt).format('YYYY-MM-DD')
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(l)
  }

  function dateLabel(date: string) {
    if (date === today) return 'Bugun'
    if (date === tomorrow) return 'Ertaga'
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const wd = weekdays[dayjs(date).day()]
    return dayjs(date).format('DD MMMM') + ', ' + (WEEKDAY_FULL[wd] || '')
  }

  if (sorted.length === 0) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mx-auto mb-4">
        <CalendarDays size={28} className="text-[var(--text-muted)]" />
      </div>
      <p className="text-[var(--text-secondary)] font-semibold mb-1">Darslar yo'q</p>
      <p className="text-sm text-[var(--text-muted)]">Guruhlar uchun jadval qo'shing</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {Object.entries(byDate).map(([date, dateLessons]) => {
        const isToday = date === today
        return (
          <div key={date}>
            <p className={[
              'text-xs font-bold uppercase tracking-wider mb-2 px-1',
              isToday ? 'text-indigo-600' : 'text-[var(--text-muted)]',
            ].join(' ')}>
              {dateLabel(date)}
            </p>
            <div className="space-y-2">
              {dateLessons.map((l, i) => {
                const colors = DAY_COLORS[l.weekday]
                return (
                  <Link
                    key={`${l.groupId}-${i}`}
                    to={`/groups/${l.groupId}`}
                    className="card p-4 flex items-center gap-4 hover:bg-[var(--bg-page)] transition-colors group animate-fade-in"
                  >
                    {/* Date box */}
                    <div className={[
                      'w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold',
                      isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : colors.bg,
                    ].join(' ')}>
                      <span className={['text-lg leading-none', isToday ? 'text-white' : colors.text].join(' ')}>
                        {dayjs(l.nextAt).format('DD')}
                      </span>
                      <span className={['text-[10px] uppercase mt-0.5', isToday ? 'text-white/75' : colors.text].join(' ')}>
                        {dayjs(l.nextAt).format('MMM')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--text-primary)] truncate">{l.groupName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-sm text-[var(--text-secondary)]">
                        <Clock size={13} />
                        <span>{l.startTime} – {endTime(l.startTime, l.durationMin)}</span>
                        <span className="text-[var(--text-muted)]">·</span>
                        <span className="text-xs text-[var(--text-muted)]">{formatDuration(l.durationMin)}</span>
                      </div>
                      <span className={[
                        'inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
                        colors.bg, colors.text,
                      ].join(' ')}>
                        {WEEKDAY_FULL[l.weekday]}
                      </span>
                    </div>

                    <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Haftalik mini-kalendar (yuqorida) ─────────────────────
function WeekStrip({ lessons, activeDay, onDayClick }: {
  lessons: NextLesson[]
  activeDay: string | null
  onDayClick: (day: string) => void
}) {
  const todayWeekday = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()]
  const lessonDays = new Set(lessons.map(l => l.weekday))

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {WEEK_ORDER.map(day => {
        const hasLesson = lessonDays.has(day)
        const isToday = day === todayWeekday
        const isActive = activeDay === day
        const colors = DAY_COLORS[day]

        return (
          <button
            key={day}
            onClick={() => onDayClick(day)}
            className={[
              'flex-1 min-w-[40px] flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all',
              isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/20'
                : isToday
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]',
            ].join(' ')}
          >
            <span className="text-[10px] font-bold uppercase">{WEEKDAY_LABELS[day]}</span>
            <div className={[
              'w-1.5 h-1.5 rounded-full transition-all',
              hasLesson
                ? isActive ? 'bg-white' : colors.dot
                : 'bg-transparent',
            ].join(' ')} />
          </button>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function SchedulePage() {
  const [lessons, setLessons] = useState<NextLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week')
  const [filterDay, setFilterDay] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/next-lessons', { params: { limit: 50 } })
        setLessons(res.data.items || [])
      } catch (err: unknown) {
        const e = err as { isOffline?: boolean; message?: string }
        if (e?.isOffline) toast.warning("Internet ulanishi yo'q")
        else toast.error(e?.message || "Yuklab bo'lmadi")
      } finally { setLoading(false) }
    }
    load()
  }, [])

  // Filter by day (only for list view)
  const filteredLessons = filterDay
    ? lessons.filter(l => l.weekday === filterDay)
    : lessons

  const totalLessons = new Set(lessons.map(l => l.weekday + l.startTime + l.groupId)).size

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Jadval</h1>
          <p className="page-subtitle">{totalLessons} ta dars / hafta</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1">
          <button
            onClick={() => { setViewMode('week'); setFilterDay(null) }}
            className={[
              'w-8 h-8 flex items-center justify-center rounded-lg transition-all',
              viewMode === 'week' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
            title="Haftalik ko'rinish"
          >
            <CalendarDays size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={[
              'w-8 h-8 flex items-center justify-center rounded-lg transition-all',
              viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
            title="Ro'yxat ko'rinish"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {loading ? <SkeletonList count={5} /> : (
        <>
          {/* Week strip — only for list mode */}
          {viewMode === 'list' && lessons.length > 0 && (
            <WeekStrip
              lessons={lessons}
              activeDay={filterDay}
              onDayClick={day => setFilterDay(prev => prev === day ? null : day)}
            />
          )}

          {/* Content */}
          {viewMode === 'week'
            ? <WeeklyView lessons={lessons} />
            : <ListView lessons={filteredLessons} />
          }
        </>
      )}
    </div>
  )
}
