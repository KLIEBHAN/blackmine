'use client'

import ReactMarkdown, { type Components } from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'
import { textileToMarkdown } from '@/lib/textile'

export const FONT_SIZE_CONFIG = {
  sm: { class: 'prose-sm', label: 'Small' },
  base: { class: 'prose-base', label: 'Normal' },
  lg: { class: 'prose-lg', label: 'Large' },
  xl: { class: 'prose-xl', label: 'Extra large' },
} as const

export type FontSize = keyof typeof FONT_SIZE_CONFIG

export type MarkdownFormat = 'markdown' | 'textile'

interface MarkdownProps {
  children: string
  className?: string
  fontSize?: FontSize
  format?: MarkdownFormat
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
          language={match ? match[1] : 'text'}
          PreTag="div"
          className="rounded-md"
          customStyle={{ overflowX: 'auto' }}
          showLineNumbers={false}
          wrapLongLines={false}
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

export function Markdown({ children, className, fontSize = 'lg', format = 'markdown' }: MarkdownProps) {
  const markdown = format === 'textile' ? textileToMarkdown(children) : children

  return (
    <div className={cn('prose max-w-none dark:prose-invert', FONT_SIZE_CONFIG[fontSize].class, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
