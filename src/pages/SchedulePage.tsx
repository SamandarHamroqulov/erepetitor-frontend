import { useEffect, useState } from 'react'
import { CalendarDays, Clock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatDate, WEEKDAY_FULL } from '../lib/date'
import dayjs from '../lib/date'
import type { NextLesson } from '../types'

function LessonCard({ lesson, index }: { lesson: NextLesson; index: number }) {
  const nextAt = dayjs(lesson.nextAt)
  const today = dayjs().format('YYYY-MM-DD')
  const isToday = nextAt.format('YYYY-MM-DD') === today
  const isTomorrow = nextAt.format('YYYY-MM-DD') === dayjs().add(1, 'day').format('YYYY-MM-DD')

  let dateLabel = formatDate(lesson.nextAt, 'DD MMM')
  if (isToday) dateLabel = 'Bugun'
  else if (isTomorrow) dateLabel = 'Ertaga'

  return (
    <div className={`card p-4 flex items-center gap-4 animate-fade-in delay-${Math.min(index * 50, 200)}`}>
      <div className={[
        'w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold',
        isToday
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
          : 'bg-[var(--bg-page)] text-[var(--text-primary)]',
      ].join(' ')}>
        <span className="text-lg leading-none">{nextAt.format('DD')}</span>
        <span className="text-[10px] uppercase opacity-75">{nextAt.format('MMM')}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--text-primary)] truncate">{lesson.groupName}</p>
        <div className="flex items-center gap-3 mt-0.5 text-sm text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {lesson.startTime} · {lesson.durationMin}min
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <span className={[
            'text-xs font-medium px-2 py-0.5 rounded-full',
            isToday
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
              : 'bg-[var(--bg-page)] text-[var(--text-secondary)]',
          ].join(' ')}>
            {dateLabel} · {WEEKDAY_FULL[lesson.weekday] || lesson.weekday}
          </span>
        </div>
      </div>

      <Link to={`/groups/${lesson.groupId}`} className="text-[var(--text-muted)] hover:text-indigo-500 transition-colors">
        <ChevronRight size={20} />
      </Link>
    </div>
  )
}

export default function SchedulePage() {
  const [lessons, setLessons] = useState<NextLesson[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/next-lessons', { params: { limit: 20 } })
        setLessons(res.data.items || [])
      } catch (err: unknown) {
        const e = err as { isOffline?: boolean; message?: string }
        if (e?.isOffline) toast.warning("Internet ulanishi yo'q")
        else toast.error(e?.message || "Yuklab bo'lmadi")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const grouped: Record<string, NextLesson[]> = {}
  lessons.forEach(l => {
    const key = dayjs(l.nextAt).format('YYYY-MM-DD')
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(l)
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Darslar jadvali</h1>
        <p className="page-subtitle">Kelayotgan darslar ro'yxati</p>
      </div>

      {loading ? (
        <SkeletonList count={5} />
      ) : lessons.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] font-medium">Darslar topilmadi</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Guruh va jadval qo'shsangiz, darslar shu yerda ko'rinadi
          </p>
          <Link to="/groups" className="inline-flex items-center gap-2 mt-4 text-indigo-500 font-medium text-sm hover:text-indigo-400">
            Guruh yaratish <ChevronRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => {
            const d = dayjs(date)
            const isToday = date === dayjs().format('YYYY-MM-DD')
            const isTomorrow = date === dayjs().add(1, 'day').format('YYYY-MM-DD')
            let label = d.format('DD MMMM')
            if (isToday) label = `Bugun · ${d.format('DD MMMM')}`
            else if (isTomorrow) label = `Ertaga · ${d.format('DD MMMM')}`

            return (
              <div key={date}>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 px-1">
                  {label}
                </p>
                <div className="space-y-2">
                  {items.map((l, i) => <LessonCard key={l.groupId + l.weekday} lesson={l} index={i} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
