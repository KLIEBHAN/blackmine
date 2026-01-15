const textilePatterns = [
  /^h[1-6]\.\s/m,
  /^bq\.\s/m,
  /"[^"]+":https?:\/\//,
  /@[^@]+@/,
  /<pre>/i,
  /<blockquote>/i,
]

export function containsTextileMarkup(text: string): boolean {
  return textilePatterns.some((pattern) => pattern.test(text))
}

export function textileToMarkdown(text: string): string {
  let result = text

  result = result.replace(/^h([1-6])\.\s+(.*)$/gm, (_, level, content) =>
    '#'.repeat(Number(level)) + ' ' + content
  )

  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s][^_]*[^_\s])_(?![a-zA-Z0-9])/g, '*$1*')
  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s])_(?![a-zA-Z0-9])/g, '*$1*')

  result = result.replace(/(?<!\w)-([^\s-][^-]*[^\s-])-(?!\w)/g, '~~$1~~')
  result = result.replace(/"([^"]+)":(\S+)/g, '[$1]($2)')
  result = result.replace(/!([^\s!]+\.(png|jpe?g|gif|svg|webp|bmp|ico))!/gi, '![]($1)')
  result = result.replace(/@([^@]+)@/g, '`$1`')
  result = result.replace(/^bq\.\s+(.*)$/gm, '> $1')

  result = result.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    return content
      .trim()
      .split('\n')
      .map((line: string) => '> ' + line)
      .join('\n')
  })

  result = result.replace(/<pre>([\s\S]*?)<\/pre>/gi, '```\n$1\n```')

  return result
}
