import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Users, Phone, ChevronRight,
  CheckCircle2, XCircle, Clock, SlidersHorizontal, X,
} from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../components/ui/Toast'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatMoney } from '../lib/date'

interface Student {
  id: number
  name: string
  parentPhone: string | null
  isActive: boolean
  customMonthlyFee: string | null
  group: { id: number; name: string } | null
}

interface Group { id: number; name: string }

type FilterStatus = 'all' | 'active' | 'inactive'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active')
  const [showFilters, setShowFilters] = useState(false)
  const toast = useToast()

  useEffect(() => {
    async function load() {
      try {
        const [studRes, grpRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/groups'),
        ])
        setStudents(studRes.data.students || [])
        setGroups(grpRes.data.groups || [])
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message || "Yuklab bo'lmadi")
      } finally { setLoading(false) }
    }
    load()
  }, [])

  // Client-side filter + search
  const filtered = useMemo(() => {
    let list = students
    if (statusFilter === 'active') list = list.filter(s => s.isActive)
    else if (statusFilter === 'inactive') list = list.filter(s => !s.isActive)
    if (groupFilter) list = list.filter(s => String(s.group?.id) === groupFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.parentPhone?.toLowerCase().includes(q) ||
        s.group?.name.toLowerCase().includes(q)
      )
    }
    return list
  }, [students, search, groupFilter, statusFilter])

  const activeCount = students.filter(s => s.isActive).length
  const hasFilters = groupFilter !== '' || statusFilter !== 'active'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">O'quvchilar</h1>
          <p className="page-subtitle">{activeCount} ta faol</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Ism, telefon yoki guruh..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9 pr-3"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={[
            'w-11 h-11 flex items-center justify-center rounded-xl border transition-all shrink-0',
            showFilters || hasFilters
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-indigo-300',
          ].join(' ')}
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 space-y-3 animate-fade-in">
          {/* Status filter */}
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Holati</p>
            <div className="flex gap-2">
              {([
                { key: 'all', label: 'Hammasi' },
                { key: 'active', label: 'Faol' },
                { key: 'inactive', label: 'Nofaol' },
              ] as { key: FilterStatus; label: string }[]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={[
                    'flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-all',
                    statusFilter === f.key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-indigo-300',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Group filter */}
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Guruh</p>
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="input-base w-full"
            >
              <option value="">Barcha guruhlar</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={() => { setGroupFilter(''); setStatusFilter('active') }}
              className="w-full py-2 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              Filtrlarni tozalash
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {(search || hasFilters) && !loading && (
        <p className="text-sm text-[var(--text-muted)] px-1">
          {filtered.length} ta natija
          {search && <span> — "<span className="font-semibold text-[var(--text-primary)]">{search}</span>"</span>}
        </p>
      )}

      {/* List */}
      {loading ? <SkeletonList count={6} /> : filtered.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-secondary)] font-semibold">
            {search ? "Topilmadi" : "O'quvchi yo'q"}
          </p>
          {search && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Boshqa so'z bilan qidiring
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Link
              key={s.id}
              to={s.group ? `/groups/${s.group.id}` : '#'}
              className="card p-4 flex items-center gap-3 hover:bg-[var(--bg-page)] transition-colors group animate-fade-in"
            >
              {/* Avatar */}
              <div className={[
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold',
                s.isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                  : 'bg-[var(--bg-page)] text-[var(--text-muted)]',
              ].join(' ')}>
                {s.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{s.name}</p>
                  {!s.isActive && (
                    <span className="text-[10px] font-semibold bg-[var(--bg-page)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-full shrink-0">
                      Nofaol
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {s.group && (
                    <span className="text-xs text-[var(--text-secondary)] truncate">{s.group.name}</span>
                  )}
                  {s.parentPhone && (
                    <a
                      href={`tel:${s.parentPhone}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-indigo-600 transition-colors"
                    >
                      <Phone size={10} />
                      {s.parentPhone}
                    </a>
                  )}
                </div>
              </div>

              {/* Custom fee badge */}
              {s.customMonthlyFee && (
                <div className="shrink-0 text-right">
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                    {formatMoney(s.customMonthlyFee, '')}
                  </span>
                </div>
              )}

              <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
