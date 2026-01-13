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
  result = result.replace(/^h1\.\s+(.*)$/gm, '# $1')
  result = result.replace(/^h2\.\s+(.*)$/gm, '## $1')
  result = result.replace(/^h3\.\s+(.*)$/gm, '### $1')
  result = result.replace(/^h4\.\s+(.*)$/gm, '#### $1')
  result = result.replace(/^h5\.\s+(.*)$/gm, '##### $1')
  result = result.replace(/^h6\.\s+(.*)$/gm, '###### $1')

  // Bold: *text* -> **text** (but only if not already markdown bold)
  // Textile uses single asterisks, markdown uses double
  // Be careful: * at line start is a list item
  result = result.replace(/(?<!\*)\*([^\s*][^*]*[^\s*])\*(?!\*)/g, '**$1**')
  result = result.replace(/(?<!\*)\*([^\s*])\*(?!\*)/g, '**$1**')

  // Italic: _text_ -> *text* (Textile uses underscores for emphasis)
  // Skip if it looks like a snake_case identifier
  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s][^_]*[^_\s])_(?![a-zA-Z0-9])/g, '*$1*')
  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s])_(?![a-zA-Z0-9])/g, '*$1*')

  // Strikethrough: -text- -> ~~text~~
  result = result.replace(/(?<![-\w])-([^\s-][^-]*[^\s-])-(?![-\w])/g, '~~$1~~')

  // Links: "text":url -> [text](url)
  result = result.replace(/"([^"]+)":(\S+)/g, '[$1]($2)')

  // Images: !url! -> ![](url)
  result = result.replace(/!(\S+?)!/g, '![]($1)')

  // Inline code: @code@ -> `code`
  result = result.replace(/@([^@]+)@/g, '`$1`')

  // Blockquote: bq. text -> > text
  result = result.replace(/^bq\.\s+(.*)$/gm, '> $1')

  // Preformatted blocks: <pre>...</pre> -> ```...```
  result = result.replace(/<pre>([\s\S]*?)<\/pre>/gi, '```\n$1\n```')

  return result
}

interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className }: MarkdownProps) {
  // Convert Textile to Markdown before rendering
  const markdown = textileToMarkdown(children)

  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{markdown}</ReactMarkdown>
    </div>
  )
}
