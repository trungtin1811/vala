"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  SeparatorHorizontal,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: number;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-lg text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-[#0052CC] text-white"
          : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1F2937]",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-4 w-px shrink-0 bg-[#E5E7EB]" />;
}

export default function RichTextEditorInner({
  value,
  onChange,
  placeholder = "Nhập nội dung…",
  label,
  minHeight = 100,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          defaultProtocol: "https",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          "px-3 py-2.5 text-sm text-[#1F2937] focus:outline-none " +
          "[&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold " +
          "[&_h1]:my-4 [&_h1]:text-2xl [&_h1]:font-bold " +
          "[&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold " +
          "[&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 " +
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 " +
          "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#CBD5E1] " +
          "[&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#64748B] " +
          "[&_a]:text-[#0052CC] [&_a]:underline [&_a]:underline-offset-2 " +
          "[&_code]:rounded [&_code]:bg-[#F1F5F9] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono " +
          "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#111827] [&_pre]:p-3 [&_pre]:text-[#F9FAFB] " +
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-4 [&_hr]:border-[#E5E7EB] " +
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none " +
          "[&_p.is-editor-empty:first-child::before]:float-left " +
          "[&_p.is-editor-empty:first-child::before]:h-0 " +
          "[&_p.is-editor-empty:first-child::before]:text-[#9CA3AF] " +
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor?.isActive("bold") ?? false,
      italic: currentEditor?.isActive("italic") ?? false,
      underline: currentEditor?.isActive("underline") ?? false,
      strike: currentEditor?.isActive("strike") ?? false,
      heading1: currentEditor?.isActive("heading", { level: 1 }) ?? false,
      heading2: currentEditor?.isActive("heading", { level: 2 }) ?? false,
      heading3: currentEditor?.isActive("heading", { level: 3 }) ?? false,
      bulletList: currentEditor?.isActive("bulletList") ?? false,
      orderedList: currentEditor?.isActive("orderedList") ?? false,
      blockquote: currentEditor?.isActive("blockquote") ?? false,
      code: currentEditor?.isActive("code") ?? false,
      codeBlock: currentEditor?.isActive("codeBlock") ?? false,
      link: currentEditor?.isActive("link") ?? false,
      canBold: currentEditor?.can().chain().focus().toggleBold().run() ?? false,
      canItalic:
        currentEditor?.can().chain().focus().toggleItalic().run() ?? false,
      canUnderline:
        currentEditor?.can().chain().focus().toggleUnderline().run() ?? false,
      canStrike:
        currentEditor?.can().chain().focus().toggleStrike().run() ?? false,
      canHeading1:
        currentEditor
          ?.can()
          .chain()
          .focus()
          .toggleHeading({ level: 1 })
          .run() ?? false,
      canHeading2:
        currentEditor
          ?.can()
          .chain()
          .focus()
          .toggleHeading({ level: 2 })
          .run() ?? false,
      canHeading3:
        currentEditor
          ?.can()
          .chain()
          .focus()
          .toggleHeading({ level: 3 })
          .run() ?? false,
      canBulletList:
        currentEditor?.can().chain().focus().toggleBulletList().run() ?? false,
      canOrderedList:
        currentEditor?.can().chain().focus().toggleOrderedList().run() ?? false,
      canBlockquote:
        currentEditor?.can().chain().focus().toggleBlockquote().run() ?? false,
      canCode:
        currentEditor?.can().chain().focus().toggleCode().run() ?? false,
      canCodeBlock:
        currentEditor?.can().chain().focus().toggleCodeBlock().run() ?? false,
      canUndo: currentEditor?.can().chain().focus().undo().run() ?? false,
      canRedo: currentEditor?.can().chain().focus().redo().run() ?? false,
    }),
  });

  if (!editor || !toolbarState) return null;

  const currentEditor = editor;

  function setLink() {
    const previousUrl = currentEditor.getAttributes("link").href as
      | string
      | undefined;
    const url = window.prompt("Nhập đường dẫn", previousUrl ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      currentEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    currentEditor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#1F2937]">{label}</label>
      )}
      <div className="border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:border-[#0052CC] focus-within:ring-2 focus-within:ring-[#0052CC]/20 transition-colors">
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <ToolbarButton
            title="Hoàn tác"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!toolbarState.canUndo}
          >
            <Undo2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Làm lại"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!toolbarState.canRedo}
          >
            <Redo2 size={14} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title="In đậm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={toolbarState.bold}
            disabled={!toolbarState.canBold}
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="In nghiêng"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={toolbarState.italic}
            disabled={!toolbarState.canItalic}
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Gạch chân"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={toolbarState.underline}
            disabled={!toolbarState.canUnderline}
          >
            <Underline size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Gạch ngang"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={toolbarState.strike}
            disabled={!toolbarState.canStrike}
          >
            <Strikethrough size={14} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title="Tiêu đề cấp 1"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={toolbarState.heading1}
            disabled={!toolbarState.canHeading1}
          >
            <Heading1 size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Tiêu đề cấp 2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={toolbarState.heading2}
            disabled={!toolbarState.canHeading2}
          >
            <Heading2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Tiêu đề cấp 3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={toolbarState.heading3}
            disabled={!toolbarState.canHeading3}
          >
            <Heading3 size={14} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title="Danh sách"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={toolbarState.bulletList}
            disabled={!toolbarState.canBulletList}
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Danh sách số"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={toolbarState.orderedList}
            disabled={!toolbarState.canOrderedList}
          >
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Trích dẫn"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={toolbarState.blockquote}
            disabled={!toolbarState.canBlockquote}
          >
            <Quote size={14} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title="Mã trong dòng"
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={toolbarState.code}
            disabled={!toolbarState.canCode}
          >
            <Code size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Khối mã"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={toolbarState.codeBlock}
            disabled={!toolbarState.canCodeBlock}
          >
            <Code2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Đường phân cách"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <SeparatorHorizontal size={14} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title="Thêm hoặc sửa liên kết"
            onClick={setLink}
            active={toolbarState.link}
          >
            <Link size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Xoá liên kết"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!toolbarState.link}
          >
            <Unlink size={14} />
          </ToolbarButton>
          <ToolbarButton
            title="Xoá định dạng"
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <RemoveFormatting size={14} />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
