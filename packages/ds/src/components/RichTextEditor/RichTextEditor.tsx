'use client';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { TableKit } from '@tiptap/extension-table';
import { Markdown } from '@tiptap/markdown';
import {
  EditorBoldIcon,
  EditorBulletListIcon,
  EditorItalicIcon,
  EditorLinkIcon,
  EditorNumberedListIcon,
  EditorQuoteIcon,
  EditorRedoIcon,
  EditorRuleIcon,
  EditorTableIcon,
  EditorUndoIcon,
} from '../../icons';
import { editor as editorStyle, headingSelect, root, toolbar, toolbarButton } from './RichTextEditor.css';

export type RichTextEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  'aria-label'?: string;
};

const headings = [1, 2, 3, 4, 5, 6] as const;

function ToolButton({
  label,
  icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={toolbarButton}
      data-active={active || undefined}
      disabled={disabled}
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

/** A visual editor which persists only the supported Markdown profile. */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  invalid = false,
  id,
  'aria-label': ariaLabel,
}: RichTextEditorProps) {
  const [selectionVersion, setSelectionVersion] = useState(0);
  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [...headings] },
        code: false,
        codeBlock: false,
        strike: false,
      }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
      TableKit,
      Markdown.configure({ markedOptions: { gfm: true } }),
    ],
    content: '',
    onUpdate: ({ editor: current }) => onChange(current.getMarkdown()),
    onSelectionUpdate: () => setSelectionVersion((current) => current + 1),
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getMarkdown() !== value) {
      editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  // Selection changes intentionally trigger this read so toolbar state stays accurate.
  void selectionVersion;
  const currentHeading = headings.find((level) => editor.isActive('heading', { level })) ?? 0;
  const command = (run: () => boolean) => () => run();
  const setLink = () => {
    const href = window.prompt('Link URL');
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  };

  return (
    <div className={root} data-invalid={invalid || undefined} data-slot="rich-text-editor">
      <div className={toolbar} aria-label="Formatting controls">
        <ToolButton label="Undo" icon={<EditorUndoIcon aria-hidden size={16} />} disabled={!editor.can().chain().focus().undo().run()} onClick={command(() => editor.chain().focus().undo().run())} />
        <ToolButton label="Redo" icon={<EditorRedoIcon aria-hidden size={16} />} disabled={!editor.can().chain().focus().redo().run()} onClick={command(() => editor.chain().focus().redo().run())} />
        <select
          className={headingSelect}
          aria-label="Heading level"
          disabled={disabled}
          value={currentHeading}
          onChange={(event) => {
            const level = Number(event.target.value) as (typeof headings)[number];
            if (level) editor.chain().focus().toggleHeading({ level }).run();
            else editor.chain().focus().setParagraph().run();
          }}
        >
          <option value="0">Paragraph</option>
          {headings.map((level) => <option key={level} value={level}>Heading {level}</option>)}
        </select>
        <ToolButton label="Bold" icon={<EditorBoldIcon aria-hidden size={16} />} active={editor.isActive('bold')} disabled={disabled} onClick={command(() => editor.chain().focus().toggleBold().run())} />
        <ToolButton label="Italic" icon={<EditorItalicIcon aria-hidden size={16} />} active={editor.isActive('italic')} disabled={disabled} onClick={command(() => editor.chain().focus().toggleItalic().run())} />
        <ToolButton label="Bulleted list" icon={<EditorBulletListIcon aria-hidden size={16} />} active={editor.isActive('bulletList')} disabled={disabled} onClick={command(() => editor.chain().focus().toggleBulletList().run())} />
        <ToolButton label="Numbered list" icon={<EditorNumberedListIcon aria-hidden size={16} />} active={editor.isActive('orderedList')} disabled={disabled} onClick={command(() => editor.chain().focus().toggleOrderedList().run())} />
        <ToolButton label="Quote" icon={<EditorQuoteIcon aria-hidden size={16} />} active={editor.isActive('blockquote')} disabled={disabled} onClick={command(() => editor.chain().focus().toggleBlockquote().run())} />
        <ToolButton label="Rule" icon={<EditorRuleIcon aria-hidden size={16} />} disabled={disabled} onClick={command(() => editor.chain().focus().setHorizontalRule().run())} />
        <ToolButton label="Link" icon={<EditorLinkIcon aria-hidden size={16} />} active={editor.isActive('link')} disabled={disabled} onClick={setLink} />
        <ToolButton label="Insert table" icon={<EditorTableIcon aria-hidden size={16} />} disabled={disabled} onClick={command(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())} />
      </div>
      <EditorContent id={id} className={editorStyle} editor={editor} aria-label={ariaLabel} data-placeholder={placeholder} />
    </div>
  );
}
