'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

/**
 * Converts Textile markup (used by Redmine) to Markdown.
 * Handles the most common patterns.
 */
function textileToMarkdown(text: string): string {
  let result = text

  // Headings: h1. -> #, h2. -> ##, etc.
  result = result.replace(/^h([1-6])\.\s+(.*)$/gm, (_, level, content) =>
    '#'.repeat(Number(level)) + ' ' + content
  )

  // Bold: *text* -> **text** (Textile uses single asterisks)
  // Negative lookbehind/ahead to avoid matching ** or list items
  result = result.replace(/(?<!\*)\*([^\s*][^*]*[^\s*])\*(?!\*)/g, '**$1**')
  result = result.replace(/(?<!\*)\*([^\s*])\*(?!\*)/g, '**$1**')

  // Italic: _text_ -> *text* (skip snake_case identifiers)
  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s][^_]*[^_\s])_(?![a-zA-Z0-9])/g, '*$1*')
  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s])_(?![a-zA-Z0-9])/g, '*$1*')

  // Strikethrough: -text- -> ~~text~~ (skip hyphenated words like "up-to-date")
  result = result.replace(/(?<!\w)-([^\s-][^-]*[^\s-])-(?!\w)/g, '~~$1~~')

  // Links: "text":url -> [text](url)
  result = result.replace(/"([^"]+)":(\S+)/g, '[$1]($2)')

  // Images: !path/to/image.ext! -> ![](path) - only match paths with file extensions
  result = result.replace(/!([^\s!]+\.(png|jpe?g|gif|svg|webp|bmp|ico))!/gi, '![]($1)')

  // Inline code: @code@ -> `code`
  result = result.replace(/@([^@]+)@/g, '`$1`')

  // Blockquote: bq. text -> > text
  result = result.replace(/^bq\.\s+(.*)$/gm, '> $1')

  // Preformatted blocks: <pre>...</pre> -> ```...```
  result = result.replace(/<pre>([\s\S]*?)<\/pre>/gi, '```\n$1\n```')

  return result
}

export const FONT_SIZE_CONFIG = {
  sm: { class: 'prose-sm', label: 'Klein' },
  base: { class: 'prose-base', label: 'Normal' },
  lg: { class: 'prose-lg', label: 'Groß' },
} as const

export type FontSize = keyof typeof FONT_SIZE_CONFIG

interface MarkdownProps {
  children: string
  className?: string
  fontSize?: FontSize
}

export function Markdown({ children, className, fontSize = 'base' }: MarkdownProps) {
  const markdown = textileToMarkdown(children)

  return (
    <div className={cn('prose max-w-none dark:prose-invert', FONT_SIZE_CONFIG[fontSize].class, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{markdown}</ReactMarkdown>
    </div>
  )
}
