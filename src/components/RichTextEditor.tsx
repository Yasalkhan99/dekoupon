"use client";

import { useRef, useEffect, useCallback } from "react";

type ToolbarButton = {
  title: string;
  cmd: string;
  val?: string;
  icon: string;
};

const TOOLBAR: ToolbarButton[] = [
  { title: "Bold", cmd: "bold", icon: "B" },
  { title: "Italic", cmd: "italic", icon: "I" },
  { title: "Underline", cmd: "underline", icon: "U" },
  { title: "Strikethrough", cmd: "strikeThrough", icon: "S̲" },
  { title: "Bullet list", cmd: "insertUnorderedList", icon: "≡" },
  { title: "Numbered list", cmd: "insertOrderedList", icon: "≡#" },
  { title: "Align left", cmd: "justifyLeft", icon: "L" },
  { title: "Align center", cmd: "justifyCenter", icon: "C" },
  { title: "Align right", cmd: "justifyRight", icon: "R" },
  { title: "Justify", cmd: "justifyFull", icon: "J" },
  { title: "Insert link", cmd: "createLink", val: "https://", icon: "🔗" },
];

function runCommand(cmd: string, val?: string) {
  if (cmd === "createLink") {
    const url = window.prompt("Enter URL:", val || "https://");
    if (url) document.execCommand(cmd, false, url);
    return;
  }
  document.execCommand(cmd, false);
}

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

export default function RichTextEditor({ value, onChange, placeholder, className = "", minHeight = "120px" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string | null>(null);

  const syncToModel = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    const normalized = html === "<br>" || html === "<p><br></p>" ? "" : html;
    lastValueRef.current = normalized;
    onChange(normalized);
  }, [onChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (lastValueRef.current === value) return;
    lastValueRef.current = value;
    el.innerHTML = value || "";
  }, [value]);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1 rounded-t border border-stone-300 border-b-0 bg-stone-100 px-2 py-1.5">
        {TOOLBAR.map((b) => (
          <button
            key={b.cmd + (b.val ?? "")}
            type="button"
            title={b.title}
            className="flex h-8 w-8 items-center justify-center rounded border border-stone-300 bg-white text-sm font-semibold text-stone-700 hover:bg-stone-50"
            onClick={() => {
              ref.current?.focus();
              runCommand(b.cmd, b.val);
              syncToModel();
            }}
          >
            {b.icon}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className="min-w-0 rounded-b border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:text-stone-400"
        style={{ minHeight }}
        onInput={syncToModel}
        onBlur={syncToModel}
      />
    </div>
  );
}
