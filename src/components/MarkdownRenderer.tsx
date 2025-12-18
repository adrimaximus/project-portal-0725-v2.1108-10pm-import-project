import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Use text-sm for paragraphs to match user preference and InteractiveText
          p: ({node, children, ...props}) => <p {...props} className="mb-2 last:mb-0 text-sm">{children}</p>,
          
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="text-sm pl-1" {...props} />,
          
          h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-4" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-2 mt-2" {...props} />,
          
          a: ({node, ...props}) => <a className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-muted pl-4 italic my-2 text-muted-foreground" {...props} />,
          code: ({node, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-muted p-2 rounded text-xs font-mono overflow-x-auto my-2" {...props}>
                {children}
              </code>
            );
          },
        } as Components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;