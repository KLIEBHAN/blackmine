'use client'

import { useCallback, useMemo, useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView, keymap } from '@codemirror/view'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks'
import { lightTheme, darkTheme } from './markdown-editor-theme'
import { Button } from './button'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  FileCode,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  CheckSquare,
  Image as ImageIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'

type ToolbarVariant = 'full' | 'compact'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  maxHeight?: string
  disabled?: boolean
  toolbarVariant?: ToolbarVariant
}

type TextAction = (
  text: string,
  selectionStart: number,
  selectionEnd: number
) => { text: string; cursorPos: number }

type ToolbarAction = {
  icon: React.ReactNode
  label: string
  shortcut?: string
  action: TextAction
  fullOnly?: boolean
}

function wrapSelection(
  text: string,
  start: number,
  end: number,
  wrapper: string
): { text: string; cursorPos: number } {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  if (selected) {
    const newText = `${before}${wrapper}${selected}${wrapper}${after}`
    return { text: newText, cursorPos: start + wrapper.length + selected.length + wrapper.length }
  }

  const newText = `${before}${wrapper}${wrapper}${after}`
  return { text: newText, cursorPos: start + wrapper.length }
}

function insertLink(
  text: string,
  start: number,
  end: number
): { text: string; cursorPos: number } {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  if (selected) {
    const newText = `${before}[${selected}](url)${after}`
    return { text: newText, cursorPos: start + selected.length + 3 }
  }

  const newText = `${before}[text](url)${after}`
  return { text: newText, cursorPos: start + 1 }
}

function insertList(
  text: string,
  start: number,
  end: number,
  ordered: boolean
): { text: string; cursorPos: number } {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  const prefix = ordered ? '1. ' : '- '
  const needsNewline = before.length > 0 && !before.endsWith('\n')
  const insert = needsNewline ? `\n${prefix}` : prefix

  if (selected) {
    const lines = selected.split('\n')
    const formatted = lines
      .map((line, i) => `${ordered ? `${i + 1}. ` : '- '}${line}`)
      .join('\n')
    const newText = `${before}${needsNewline ? '\n' : ''}${formatted}${after}`
    return { text: newText, cursorPos: start + (needsNewline ? 1 : 0) + formatted.length }
  }

  const newText = `${before}${insert}${after}`
  return { text: newText, cursorPos: start + insert.length }
}

function insertCodeBlock(
  text: string,
  start: number,
  end: number
): { text: string; cursorPos: number } {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  const needsNewlineBefore = before.length > 0 && !before.endsWith('\n')
  const needsNewlineAfter = after.length > 0 && !after.startsWith('\n')

  const block = `${needsNewlineBefore ? '\n' : ''}\`\`\`\n${selected}\n\`\`\`${needsNewlineAfter ? '\n' : ''}`
  const newText = `${before}${block}${after}`

  const cursorPos = before.length + (needsNewlineBefore ? 1 : 0) + 3
  return { text: newText, cursorPos }
}

function toggleBlockquote(
  text: string,
  start: number,
  end: number
): { text: string; cursorPos: number } {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  const needsNewline = before.length > 0 && !before.endsWith('\n')
  const selection = selected || ''
  const lines = selection ? selection.split('\n') : ['']

  const allQuoted = lines.every((line) => line.trim() === '' || line.startsWith('> '))
  const updatedLines = allQuoted
    ? lines.map((line) => (line.startsWith('> ') ? line.slice(2) : line))
    : lines.map((line) => (line.trim() === '' ? line : `> ${line}`))

  const updatedSelection = updatedLines.join('\n')
  const prefix = needsNewline ? '\n' : ''
  const newText = `${before}${prefix}${updatedSelection}${after}`

  const cursorPos = before.length + prefix.length + updatedSelection.length
  return { text: newText, cursorPos }
}

function insertHeading(
  text: string,
  start: number,
  end: number,
  level: 1 | 2 | 3
): { text: string; cursorPos: number } {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  const prefix = `${'#'.repeat(level)} `
  const needsNewline = before.length > 0 && !before.endsWith('\n')
  const content = selected || 'Heading'
  const newText = `${before}${needsNewline ? '\n' : ''}${prefix}${content}${after}`

  const cursorPos = before.length + (needsNewline ? 1 : 0) + prefix.length + content.length
  return { text: newText, cursorPos }
}

function insertHorizontalRule(
  text: string,
  start: number,
  end: number
): { text: string; cursorPos: number } {
  const before = text.slice(0, start)
  const after = text.slice(end)

  const needsNewlineBefore = before.length > 0 && !before.endsWith('\n')
  const needsNewlineAfter = after.length > 0 && !after.startsWith('\n')

  const block = `${needsNewlineBefore ? '\n' : ''}---${needsNewlineAfter ? '\n' : ''}`
  const newText = `${before}${block}${after}`
  const cursorPos = before.length + (needsNewlineBefore ? 1 : 0) + 3

  return { text: newText, cursorPos }
}

function insertTaskList(
  text: string,
  start: number,
  end: number
): { text: string; cursorPos: number } {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  const needsNewline = before.length > 0 && !before.endsWith('\n')

  if (selected) {
    const lines = selected.split('\n')
    const formatted = lines.map((line) => `- [ ] ${line}`).join('\n')
    const newText = `${before}${needsNewline ? '\n' : ''}${formatted}${after}`
    return { text: newText, cursorPos: start + (needsNewline ? 1 : 0) + formatted.length }
  }

  const insert = `${needsNewline ? '\n' : ''}- [ ] `
  const newText = `${before}${insert}${after}`
  return { text: newText, cursorPos: start + insert.length }
}

function insertImage(
  text: string,
  start: number,
  end: number
): { text: string; cursorPos: number } {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  const altText = selected || 'alt text'
  const newText = `${before}![${altText}](url)${after}`
  return { text: newText, cursorPos: start + 2 }
}

function applyActionToView(view: EditorView, action: TextAction): boolean {
  const text = view.state.doc.toString()
  const { from, to } = view.state.selection.main
  const result = action(text, from, to)

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.text },
    selection: { anchor: result.cursorPos },
  })
  return true
}

const boldAction: TextAction = (text, start, end) => wrapSelection(text, start, end, '**')
const italicAction: TextAction = (text, start, end) => wrapSelection(text, start, end, '*')
const codeAction: TextAction = (text, start, end) => wrapSelection(text, start, end, '`')
const linkAction: TextAction = insertLink
const blockquoteAction: TextAction = toggleBlockquote
const heading1Action: TextAction = (text, start, end) => insertHeading(text, start, end, 1)
const heading2Action: TextAction = (text, start, end) => insertHeading(text, start, end, 2)
const heading3Action: TextAction = (text, start, end) => insertHeading(text, start, end, 3)
const horizontalRuleAction: TextAction = insertHorizontalRule
const taskListAction: TextAction = insertTaskList
const imageAction: TextAction = insertImage

const markdownKeymap = keymap.of([
  { key: 'Mod-b', run: (view) => applyActionToView(view, boldAction) },
  { key: 'Mod-i', run: (view) => applyActionToView(view, italicAction) },
  { key: 'Mod-e', run: (view) => applyActionToView(view, codeAction) },
  { key: 'Mod-k', run: (view) => applyActionToView(view, linkAction) },
])

const toolbarActions: ToolbarAction[] = [
  {
    icon: <Bold className="size-4" />,
    label: 'Bold',
    shortcut: 'Ctrl+B',
    action: boldAction,
  },
  {
    icon: <Italic className="size-4" />,
    label: 'Italic',
    shortcut: 'Ctrl+I',
    action: italicAction,
  },
  {
    icon: <Strikethrough className="size-4" />,
    label: 'Strikethrough',
    action: (text, start, end) => wrapSelection(text, start, end, '~~'),
    fullOnly: true,
  },
  {
    icon: <Code className="size-4" />,
    label: 'Inline Code',
    shortcut: 'Ctrl+E',
    action: codeAction,
  },
  {
    icon: <FileCode className="size-4" />,
    label: 'Code Block',
    action: insertCodeBlock,
    fullOnly: true,
  },
  {
    icon: <Quote className="size-4" />,
    label: 'Block Quote',
    action: blockquoteAction,
    fullOnly: true,
  },
  {
    icon: <Heading1 className="size-4" />,
    label: 'Heading 1',
    action: heading1Action,
    fullOnly: true,
  },
  {
    icon: <Heading2 className="size-4" />,
    label: 'Heading 2',
    action: heading2Action,
    fullOnly: true,
  },
  {
    icon: <Heading3 className="size-4" />,
    label: 'Heading 3',
    action: heading3Action,
    fullOnly: true,
  },
  {
    icon: <Minus className="size-4" />,
    label: 'Horizontal Rule',
    action: horizontalRuleAction,
    fullOnly: true,
  },
  {
    icon: <CheckSquare className="size-4" />,
    label: 'Task List',
    action: taskListAction,
    fullOnly: true,
  },
  {
    icon: <ImageIcon className="size-4" />,
    label: 'Image',
    action: imageAction,
    fullOnly: true,
  },
  {
    icon: <Link className="size-4" />,
    label: 'Link',
    shortcut: 'Ctrl+K',
    action: linkAction,
  },
  {
    icon: <List className="size-4" />,
    label: 'Bullet List',
    action: (text, start, end) => insertList(text, start, end, false),
    fullOnly: true,
  },
  {
    icon: <ListOrdered className="size-4" />,
    label: 'Numbered List',
    action: (text, start, end) => insertList(text, start, end, true),
    fullOnly: true,
  },
]


export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = '120px',
  maxHeight = '320px',
  disabled = false,
  toolbarVariant = 'full',
}: Props) {
  const theme = useTheme()
  const editorRef = useRef<ReactCodeMirrorRef>(null)

  const extensions = useMemo(
    () => [
      markdownKeymap,
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.lineWrapping,
    ],
    []
  )

  const handleChange = useCallback(
    (val: string) => {
      onChange(val)
    },
    [onChange]
  )

  const handleToolbarAction = useCallback(
    (action: ToolbarAction['action']) => {
      const view = editorRef.current?.view
      if (!view) {
        const result = action(value, value.length, value.length)
        onChange(result.text)
        return
      }

      const { from, to } = view.state.selection.main
      const result = action(value, from, to)
      onChange(result.text)

      requestAnimationFrame(() => {
        view.focus()
        view.dispatch({
          selection: { anchor: result.cursorPos },
        })
      })
    },
    [value, onChange]
  )

  const visibleActions = useMemo(
    () =>
      toolbarVariant === 'full'
        ? toolbarActions
        : toolbarActions.filter((a) => !a.fullOnly),
    [toolbarVariant]
  )

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-transparent shadow-xs transition-colors',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0.5 border-b border-input px-2 py-1.5">
          {visibleActions.map((action) => (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleToolbarAction(action.action)}
                  disabled={disabled}
                  aria-label={action.label}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {action.label}
                {action.shortcut && (
                  <span className="ml-2 text-muted-foreground">
                    {action.shortcut}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <CodeMirror
        ref={editorRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        extensions={extensions}
        theme={theme === 'dark' ? darkTheme : lightTheme}
        editable={!disabled}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          autocompletion: false,
          searchKeymap: false,
        }}
        style={{
          minHeight,
          maxHeight,
          overflow: 'auto',
        }}
      />
    </div>
  )
}
