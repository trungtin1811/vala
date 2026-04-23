export function computeEndDate(date: string, startTime: string, endTime: string): string | null {
  if (!date || !startTime || !endTime) return null
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const startMins = sh * 60 + sm
  const endMins = eh * 60 + em
  const isNextDay = endMins <= startMins
  if (!isNextDay) return date
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function formatTimeRange(
  startTime: string,
  endTime: string | null,
  startDate: string,
  endDate: string | null
): string {
  const fmt = (t: string) => t.slice(0, 5)
  if (!endTime) return fmt(startTime)
  const sameDay = !endDate || endDate === startDate
  return sameDay
    ? `${fmt(startTime)} – ${fmt(endTime)}`
    : `${fmt(startTime)} – ${fmt(endTime)} (+1 ngày)`
}
