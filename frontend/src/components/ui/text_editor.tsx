"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function RichTextEditor({ value, onChange, placeholder = "Escribe aquí...", rows = 8 }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [cursorPos, setCursorPos] = useState(0)

  const applyFormat = (before: string, after = "", selectText = true) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end) || "texto"
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)

    const newValue = `${beforeText}${before}${selectedText}${after}${afterText}`
    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      const newStart = start + before.length
      if (selectText) {
        textarea.setSelectionRange(newStart, newStart + selectedText.length)
      } else {
        textarea.setSelectionRange(
          newStart + selectedText.length + after.length,
          newStart + selectedText.length + after.length,
        )
      }
    }, 0)
  }

  const insertFormat = (format: string) => {
    switch (format) {
      case "bold":
        applyFormat("**", "**")
        break
      case "italic":
        applyFormat("*", "*")
        break
      case "h1":
        applyFormat("# ", "")
        break
      case "h2":
        applyFormat("## ", "")
        break
      case "h3":
        applyFormat("### ", "")
        break
      case "ul":
        applyFormat("• ")
        break
      case "ol":
        applyFormat("1. ")
        break
      case "indent":
        applyFormat("    ")
        break
      case "outdent":
        if (value.substring(cursorPos - 4, cursorPos) === "    ") {
          const start = textareaRef.current?.selectionStart || 0
          const end = textareaRef.current?.selectionEnd || 0
          const beforeText = value.substring(0, Math.max(0, start - 4))
          const afterText = value.substring(start)
          onChange(beforeText + afterText)
        }
        break
    }
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-3 bg-[#1A1A1A] border border-[#3E3E3E] rounded-t-lg">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertFormat("bold")}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3E3E3E] transition-colors"
          title="Negrita (Ctrl+B)"
        >
          <Bold size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertFormat("italic")}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3E3E3E] transition-colors"
          title="Itálica (Ctrl+I)"
        >
          <Italic size={16} />
        </Button>

        <div className="w-px bg-[#3E3E3E] mx-1"></div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertFormat("h1")}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3E3E3E] transition-colors"
          title="Título 1"
        >
          <Heading1 size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertFormat("h2")}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3E3E3E] transition-colors"
          title="Título 2"
        >
          <Heading2 size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertFormat("h3")}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3E3E3E] transition-colors"
          title="Título 3"
        >
          <Heading3 size={16} />
        </Button>

        <div className="w-px bg-[#3E3E3E] mx-1"></div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertFormat("ul")}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3E3E3E] transition-colors"
          title="Lista sin orden"
        >
          <List size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertFormat("ol")}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3E3E3E] transition-colors"
          title="Lista ordenada"
        >
          <ListOrdered size={16} />
        </Button>

        <div className="w-px bg-[#3E3E3E] mx-1"></div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertFormat("indent")}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3E3E3E] transition-colors"
          title="Aumentar sangría"
        >
          <IndentIncrease size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => insertFormat("outdent")}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-[#3E3E3E] transition-colors"
          title="Disminuir sangría"
        >
          <IndentDecrease size={16} />
        </Button>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setCursorPos(e.target.selectionStart)
        }}
        onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-t-0 border-[#4E4E4E] bg-[#1A1A1A] text-gray-300 placeholder:text-gray-600 focus:border-blue-600 focus:outline-none resize-none rounded-b-lg p-3 font-mono text-sm leading-relaxed"
      />

      {/* Format preview info */}
      <p className="text-xs text-gray-500 px-2">
        💡 Usa <span className="font-mono bg-[#1A1A1A] px-1">**texto**</span> para negrita,{" "}
        <span className="font-mono bg-[#1A1A1A] px-1">*texto*</span> para itálica, y{" "}
        <span className="font-mono bg-[#1A1A1A] px-1">#</span> para títulos
      </p>
    </div>
  )
}
