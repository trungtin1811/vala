import { cn } from '@/lib/utils'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#1F2937]">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] bg-white',
          'focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20',
          'transition-colors duration-200 cursor-pointer',
          error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  )
}
