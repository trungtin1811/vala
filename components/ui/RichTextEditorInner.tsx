'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  label?: string
  minHeight?: number
}

function ToolbarButton({ onClick, active, title, children }: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={cn(
        'p-1.5 rounded-lg text-sm transition-colors',
        active ? 'bg-[#0052CC] text-white' : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2937]'
      )}
    >
      {children}
    </button>
  )
}

export default function RichTextEditorInner({ value, onChange, placeholder = 'Nhập nội dung…', label, minHeight = 100 }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'px-3 py-2.5 text-sm text-[#1F2937] focus:outline-none prose prose-sm max-w-none',
        style: `min-height: ${minHeight}px`,
      },
    },
  })

  if (!editor) return null

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#1F2937]">{label}</label>}
      <div className="border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:border-[#0052CC] focus-within:ring-2 focus-within:ring-[#0052CC]/20 transition-colors">
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <ToolbarButton
            title="In đậm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="In nghiêng"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Tiêu đề"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 size={14} />
          </ToolbarButton>
          <div className="w-px h-4 bg-[#E5E7EB] mx-1" />
          <ToolbarButton
            title="Danh sách"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Danh sách số"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
          >
            <ListOrdered size={14} />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
