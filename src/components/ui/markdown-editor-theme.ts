import { EditorView } from '@codemirror/view'
import { Extension } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

type ThemeColors = {
  background: string
  foreground: string
  caret: string
  selection: string
  gutterForeground: string
  border: string
  link: string
  url: string
  codeBg: string
  quote: string
  list: string
  keyword: string
  string: string
  number: string
  comment: string
  meta: string
}

const lightColors: ThemeColors = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.18 0.02 250)',
  caret: 'oklch(0.35 0.12 250)',
  selection: 'oklch(0.7 0.16 75 / 0.25)',
  gutterForeground: 'oklch(0.45 0.02 250)',
  border: 'oklch(0.88 0.01 90)',
  link: 'oklch(0.35 0.12 250)',
  url: 'oklch(0.45 0.1 250)',
  codeBg: 'oklch(0.94 0.005 90)',
  quote: 'oklch(0.45 0.02 250)',
  list: 'oklch(0.35 0.12 250)',
  keyword: 'oklch(0.5 0.2 300)',
  string: 'oklch(0.45 0.15 145)',
  number: 'oklch(0.5 0.18 55)',
  comment: 'oklch(0.55 0.02 250)',
  meta: 'oklch(0.45 0.02 250)',
}

const darkColors: ThemeColors = {
  background: 'oklch(0.21 0.02 250)',
  foreground: 'oklch(0.92 0.01 90)',
  caret: 'oklch(0.65 0.18 55)',
  selection: 'oklch(0.65 0.18 55 / 0.3)',
  gutterForeground: 'oklch(0.6 0.02 250)',
  border: 'oklch(0.34 0.02 250)',
  link: 'oklch(0.7 0.16 75)',
  url: 'oklch(0.6 0.12 75)',
  codeBg: 'oklch(0.25 0.02 250)',
  quote: 'oklch(0.6 0.02 250)',
  list: 'oklch(0.7 0.16 75)',
  keyword: 'oklch(0.7 0.15 300)',
  string: 'oklch(0.7 0.15 145)',
  number: 'oklch(0.75 0.15 55)',
  comment: 'oklch(0.55 0.02 250)',
  meta: 'oklch(0.6 0.02 250)',
}

function createEditorTheme(colors: ThemeColors, isDark: boolean): Extension {
  return EditorView.theme(
    {
      '&': {
        backgroundColor: colors.background,
        color: colors.foreground,
      },
      '.cm-content': {
        caretColor: colors.caret,
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        fontSize: '14px',
        lineHeight: '1.6',
        padding: '12px 0',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: colors.caret,
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        {
          backgroundColor: colors.selection,
        },
      '.cm-panels': {
        backgroundColor: colors.background,
        color: colors.foreground,
      },
      '.cm-panels.cm-panels-top': {
        borderBottom: `1px solid ${colors.border}`,
      },
      '.cm-panels.cm-panels-bottom': {
        borderTop: `1px solid ${colors.border}`,
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        color: colors.gutterForeground,
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
      '.cm-placeholder': {
        color: colors.gutterForeground,
        fontStyle: 'italic',
      },
    },
    { dark: isDark }
  )
}

function createHighlightStyle(colors: ThemeColors): HighlightStyle {
  return HighlightStyle.define([
    { tag: t.heading1, fontWeight: '700', fontSize: '1.4em' },
    { tag: t.heading2, fontWeight: '700', fontSize: '1.25em' },
    { tag: t.heading3, fontWeight: '600', fontSize: '1.1em' },
    { tag: t.heading4, fontWeight: '600' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strong, fontWeight: '700' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.link, color: colors.link, textDecoration: 'underline' },
    { tag: t.url, color: colors.url },
    {
      tag: t.monospace,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.9em',
      backgroundColor: colors.codeBg,
      padding: '1px 4px',
      borderRadius: '3px',
    },
    { tag: t.quote, color: colors.quote, fontStyle: 'italic' },
    { tag: t.list, color: colors.list },
    { tag: t.keyword, color: colors.keyword },
    { tag: t.string, color: colors.string },
    { tag: t.number, color: colors.number },
    { tag: t.comment, color: colors.comment, fontStyle: 'italic' },
    { tag: t.processingInstruction, color: colors.meta },
  ])
}

export const lightTheme: Extension = [
  createEditorTheme(lightColors, false),
  syntaxHighlighting(createHighlightStyle(lightColors)),
]

export const darkTheme: Extension = [
  createEditorTheme(darkColors, true),
  syntaxHighlighting(createHighlightStyle(darkColors)),
]
