import { Badge } from '@/components/ui/Badge'
import type { EventStatus } from '@/types'

const config: Record<EventStatus, { label: string; variant: 'green' | 'orange' | 'gray' | 'red' }> = {
  active: { label: 'Đang Tuyển', variant: 'green' },
  closed: { label: 'Đã Đủ Người', variant: 'orange' },
  completed: { label: 'Đã Diễn Ra', variant: 'gray' },
  cancelled: { label: 'Đã Huỷ', variant: 'red' },
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}
