// ── Auth ────────────────────────────────────────────────
export type TeacherRole = 'TEACHER' | 'ADMIN'

export interface Teacher {
  id: number
  name: string
  email: string
  avatarUrl: string | null
  role?: TeacherRole
  createdAt: string
}

// ── Subscription / Billing ──────────────────────────────
export type SubStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED'

export interface Subscription {
  id: number
  teacherId: number
  status: SubStatus
  trialEndsAt: string | null
  currentPeriodEndsAt: string | null
  createdAt: string
}

export type BillingPaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED'

export interface BillingPayment {
  id: number
  amount: string | number
  months: number
  status: BillingPaymentStatus
  proofUrl: string | null
  note: string | null
  rejectReason: string | null
  createdAt: string
  confirmedAt: string | null
}

export interface PayInfo {
  cardOwner: string
  cardNumber: string
  cardNumberFull: string
  bankName: string
}

export interface BillingMeResponse {
  subscription: Subscription | null
  pricing: { monthlyPrice: number; currency: string }
  payInfo: PayInfo
}

// ── Groups ──────────────────────────────────────────────
export interface Group {
  id: number
  name: string
  subject: string | null
  monthlyPrice: string
  days: string[]
  time: string | null
  teacherId: number
  createdAt: string
  _count?: { students: number }
}

export interface GroupSchedule {
  id: number
  groupId: number
  weekday: string
  startTime: string
  durationMin: number
  isActive?: boolean
}

// ── Students ────────────────────────────────────────────
export interface Student {
  id: number
  name: string
  parentPhone: string | null
  isActive: boolean
  paymentStartDate?: string | null
  customMonthlyFee?: string | null
  groupId?: number
  createdAt: string
  group?: { id: number; name: string }
}

export interface StudentPaymentThisMonth {
  id: number
  status: 'DUE' | 'PAID' | 'PARTIAL'
  amount: string
  paidAmount: string
  paidAt: string | null
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'
export interface AttendanceRecord {
  id: number
  studentId: number
  status: AttendanceStatus
}

export interface StudentWithPayment extends Student {
  paymentThisMonth: StudentPaymentThisMonth | null
}

// ── Payments ────────────────────────────────────────────
export type PaymentStatus = 'DUE' | 'PAID' | 'PARTIAL'

export interface Payment {
  id: number
  studentId: number
  month: string
  amount: string
  paidAmount: string
  status: PaymentStatus
  paidAt: string | null
  createdAt: string
  student: {
    id: number
    name: string
    parentPhone: string | null
    isActive: boolean
    group: { id: number; name: string }
  }
}

export interface PaymentsSummary {
  counts: { due: number; paid: number; total: number }
  sums: { due: string; paid: string }
}

// ── Dashboard ───────────────────────────────────────────
export interface DashboardMain {
  month: string
  totalStudents: number
  activeStudents: number
  dueCount: number
  paidCount: number
  dueSum: string
  paidSum: string
  activeGroups: number
  groupList: Array<{ id: number; name: string; activeStudents: number }>
  todaySchedules: Array<{
    groupId: number
    groupName: string
    startTime: string
    durationMin: number
  }>
}

export interface NextLesson {
  groupId: number
  groupName: string
  weekday: string
  startTime: string
  durationMin: number
  nextAt: string
  endAt: string
}

// ── API generic ─────────────────────────────────────────
export interface ApiError {
  message: string
  code?: string
}
