'use client'

import ReactMarkdown, { type Components } from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

/**
 * Detects if text contains Textile-specific markup patterns.
 * Used to decide whether to apply Textile-to-Markdown conversion.
 */
function containsTextileMarkup(text: string): boolean {
  const textilePatterns = [
    /^h[1-6]\.\s/m,           // Textile headings: h1. h2. etc.
    /^bq\.\s/m,               // Textile blockquote: bq.
    /"[^"]+":https?:\/\//,    // Textile links: "text":url
    /@[^@]+@/,                // Textile inline code: @code@ or @inline code@
    /<pre>/i,                 // HTML pre tags (common in Textile)
    /<blockquote>/i,          // HTML blockquotes
  ]
  return textilePatterns.some(pattern => pattern.test(text))
}

/**
 * Converts Textile markup (used by Redmine) to Markdown.
 * Only applies conversion if Textile-specific patterns are detected.
 */
function textileToMarkdown(text: string): string {
  if (!containsTextileMarkup(text)) {
    return text
  }

  let result = text

  // Headings: h1. -> #, h2. -> ##, etc.
  result = result.replace(/^h([1-6])\.\s+(.*)$/gm, (_, level, content) =>
    '#'.repeat(Number(level)) + ' ' + content
  )

  // Italic: _text_ -> *text* (skip snake_case identifiers)
  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s][^_]*[^_\s])_(?![a-zA-Z0-9])/g, '*$1*')
  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s])_(?![a-zA-Z0-9])/g, '*$1*')

  // Strikethrough: -text- -> ~~text~~ (skip hyphenated words)
  result = result.replace(/(?<!\w)-([^\s-][^-]*[^\s-])-(?!\w)/g, '~~$1~~')

  // Links: "text":url -> [text](url)
  result = result.replace(/"([^"]+)":(\S+)/g, '[$1]($2)')

  // Images: !path/to/image.ext! -> ![](path)
  result = result.replace(/!([^\s!]+\.(png|jpe?g|gif|svg|webp|bmp|ico))!/gi, '![]($1)')

  // Inline code: @code@ -> `code`
  result = result.replace(/@([^@]+)@/g, '`$1`')

  // Blockquote: bq. text -> > text
  result = result.replace(/^bq\.\s+(.*)$/gm, '> $1')

  // HTML blockquotes: <blockquote>...</blockquote> -> > prefixed lines
  result = result.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    return content
      .trim()
      .split('\n')
      .map((line: string) => '> ' + line)
      .join('\n')
  })

  // Preformatted blocks: <pre>...</pre> -> ```...```
  result = result.replace(/<pre>([\s\S]*?)<\/pre>/gi, '```\n$1\n```')

  return result
}

export const FONT_SIZE_CONFIG = {
  sm: { class: 'prose-sm', label: 'Small' },
  base: { class: 'prose-base', label: 'Normal' },
  lg: { class: 'prose-lg', label: 'Large' },
  xl: { class: 'prose-xl', label: 'Extra large' },
} as const

export type FontSize = keyof typeof FONT_SIZE_CONFIG

interface MarkdownProps {
  children: string
  className?: string
  fontSize?: FontSize
}

const components: Components = {
  pre({ children }) {
    return <div className="not-prose">{children}</div>
  },
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    const codeString = String(children).replace(/\n$/, '')
    
    // Fenced code blocks have className set (even if empty) or are multi-line
    const isFencedBlock = className !== undefined || codeString.includes('\n')
    
    if (isFencedBlock) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={match?.[1] || 'text'}
          PreTag="div"
          className="rounded-md text-sm"
        >
          {codeString}
        </SyntaxHighlighter>
      )
    }
    
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },
}

export function Markdown({ children, className, fontSize = 'lg' }: MarkdownProps) {
  const markdown = textileToMarkdown(children)

  return (
    <div className={cn('prose max-w-none dark:prose-invert', FONT_SIZE_CONFIG[fontSize].class, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
