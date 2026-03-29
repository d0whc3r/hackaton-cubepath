import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: Readonly<MarkdownRendererProps>) {
  return (
    <div className={`prose-response ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
