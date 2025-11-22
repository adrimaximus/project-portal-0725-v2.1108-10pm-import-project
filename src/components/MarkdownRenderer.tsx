import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className }) => {
  // Pre-process mentions: @[Name](id) -> [@Name](mention:id)
  // This allows us to detect mentions in the markdown AST as links with a specific protocol
  const processedContent = children.replace(/@\[(.*?)\]\((.*?)\)/g, '[@$1](mention:$2)');

  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        a: ({ node, href, children, ...props }) => {
          if (href?.startsWith('mention:')) {
            // Render mentions as styled spans instead of links
            return (
              <span className="font-semibold text-primary hover:underline cursor-pointer">
                {children}
              </span>
            );
          }
          return (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline" 
              {...props}
            >
              {children}
            </a>
          );
        },
        // Ensure paragraphs don't have excessive margins if controlled by parent typography class
        p: ({node, children, ...props}) => <p {...props} className="mb-1 last:mb-0">{children}</p>
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;