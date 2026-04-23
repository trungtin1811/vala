import { cn } from '@/lib/utils'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#1F2937]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] placeholder:text-[#9CA3AF] resize-none',
          'focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20',
          'transition-colors duration-200',
          error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  )
}
