import { cn } from '@/lib/utils'
import { SKILL_LEVEL_LABELS, type SkillLevel } from '@/types'

const styles: Record<SkillLevel, string> = {
  yeu_minus: 'bg-red-50 text-red-600',
  yeu: 'bg-red-50 text-red-700',
  yeu_plus: 'bg-orange-50 text-orange-600',
  tby_minus: 'bg-orange-50 text-orange-700',
  tby: 'bg-yellow-50 text-yellow-700',
  tby_plus: 'bg-yellow-50 text-yellow-800',
  tb_minus: 'bg-lime-50 text-lime-700',
  tb: 'bg-lime-50 text-lime-800',
  tb_plus: 'bg-green-50 text-green-700',
  kha_minus: 'bg-[#E8F3FF] text-[#0052CC]',
  kha: 'bg-blue-100 text-blue-700',
  kha_plus: 'bg-blue-100 text-blue-800',
  gioi_minus: 'bg-indigo-50 text-indigo-700',
  gioi: 'bg-[#0052CC] text-white',
  gioi_plus: 'bg-[#1E3A8A] text-white',
}

interface SkillLevelBadgeProps {
  level: SkillLevel
  className?: string
}

export function SkillLevelBadge({ level, className }: SkillLevelBadgeProps) {
  return (
    <span className={cn('inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full', styles[level], className)}>
      {SKILL_LEVEL_LABELS[level]}
    </span>
  )
}
