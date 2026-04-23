import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'orange' | 'gray' | 'red' | 'blue'
  className?: string
}

const variants = {
  green: 'bg-emerald-100 text-emerald-700',
  orange: 'bg-amber-100 text-amber-700',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-[#E8F3FF] text-[#0052CC]',
}

export function Badge({ children, variant = 'blue', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full', variants[variant], className)}>
      {children}
    </span>
  )
}
