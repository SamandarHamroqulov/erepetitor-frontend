import dayjs from 'dayjs'
import 'dayjs/locale/uz'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)
dayjs.locale('uz')

export default dayjs

export function formatDate(date: string | Date, format = 'DD MMM YYYY') {
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date) {
  return dayjs(date).format('DD MMM YYYY, HH:mm')
}

export function formatMonthLabel(ym: string) {
  // ym = "2025-03" → "Mart 2025"
  return dayjs(ym + '-01').format('MMMM YYYY')
}

export function currentMonthISO() {
  return dayjs().format('YYYY-MM-DD')
}

export function currentYM() {
  return dayjs().format('YYYY-MM')
}

export function formatTimeAgo(date: string | Date) {
  return dayjs(date).fromNow()
}

export function formatMoney(amount: string | number, currency = 'UZS') {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return '—'
  return n.toLocaleString('uz-UZ') + ' ' + currency
}

export const WEEKDAY_LABELS: Record<string, string> = {
  MON: 'Du', TUE: 'Se', WED: 'Chor', THU: 'Pay', FRI: 'Ju', SAT: 'Sha', SUN: 'Yak',
}

export const WEEKDAY_FULL: Record<string, string> = {
  MON: 'Dushanba', TUE: 'Seshanba', WED: 'Chorshanba',
  THU: 'Payshanba', FRI: 'Juma', SAT: 'Shanba', SUN: 'Yakshanba',
}
