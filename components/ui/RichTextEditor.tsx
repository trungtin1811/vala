'use client'

import dynamic from 'next/dynamic'

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  label?: string
  minHeight?: number
}

const RichTextEditor = dynamic(() => import('./RichTextEditorInner'), {
  ssr: false,
  loading: ({ }) => (
    <div className="flex flex-col gap-1.5">
      <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="h-8 bg-[#F9FAFB] border-b border-[#E5E7EB]" />
        <div className="min-h-[100px] px-3 py-2.5" />
      </div>
    </div>
  ),
})

export { RichTextEditor }
