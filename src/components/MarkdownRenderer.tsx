import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Components } from 'react-markdown';
import { Link } from 'react-router-dom';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  // Preprocess content to handle custom syntax like mentions
  const processedContent = useMemo(() => {
    if (!content) return "";
    
    // Convert @[Name](id) to [Name](mention:id)
    // This allows the markdown parser to treat it as a link, which we then intercept
    let processed = content.replace(/@\[([^\]]+)\]\s*\(([^)]+)\)/g, '[$1](mention:$2)');
    
    return processed;
  }, [content]);

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Enhanced paragraph styling with relaxed line height
          p: ({node, children, ...props}) => <p {...props} className="mb-2 last:mb-0 text-sm leading-relaxed whitespace-pre-wrap break-words">{children}</p>,
          
          // Enhanced list styling
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1 text-sm" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1 text-sm" {...props} />,
          li: ({node, ...props}) => <li className="pl-1 leading-relaxed" {...props} />,
          
          // Enhanced headings
          h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-4 text-foreground/90" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3 text-foreground/90" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-2 mt-2 text-foreground/90" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-sm font-semibold mb-1 mt-2 text-foreground/90" {...props} />,
          
          // Custom link handling for mentions and tasks
          a: ({node, href, children, ...props}) => {
            if (!href) return <a {...props}>{children}</a>;

            // Handle Mentions
            if (href.startsWith('mention:')) {
              // const id = href.replace('mention:', '');
              return (
                <span className="font-bold text-primary bg-primary/10 px-1 py-0.5 rounded-sm hover:underline cursor-pointer whitespace-nowrap">
                  @{children}
                </span>
              );
            }

            // Handle Task Links
            if (href.startsWith('task:')) {
              const segments = href.split(':');
              if (segments.length >= 3) {
                  const slug = segments[1];
                  const taskId = segments[2];
                  const url = `/projects/${slug}?tab=tasks&task=${taskId}`;
                  return (
                    <Link to={url} className="text-primary underline hover:text-primary/80 break-words transition-colors">
                      {children}
                    </Link>
                  );
              }
            }

            // Internal Links
            if (href.startsWith('/')) {
              return (
                <Link to={href} className="text-primary underline hover:text-primary/80 break-all transition-colors">
                  {children}
                </Link>
              );
            }

            // External Links
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary underline hover:text-primary/80 break-all transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          
          // Enhanced blockquote
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/20 bg-muted/30 pl-4 py-2 italic my-2 text-muted-foreground rounded-r-md text-sm" {...props} />,
          
          // Enhanced table support
          table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-md border"><table className="w-full text-sm text-left" {...props} /></div>,
          thead: ({node, ...props}) => <thead className="bg-muted text-muted-foreground font-medium" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-muted/50 transition-colors" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-2 font-medium" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-2" {...props} />,

          // Enhanced image styling
          img: ({node, ...props}) => <img className="max-w-full h-auto rounded-md my-2 border shadow-sm max-h-[400px] object-contain bg-muted/20" {...props} />,

          // Enhanced divider
          hr: ({node, ...props}) => <hr className="my-4 border-muted" {...props} />,

          // Code blocks
          code: ({node, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props}>
                {children}
              </code>
            ) : (
              <pre className="block bg-muted/80 p-3 rounded-md text-xs font-mono overflow-x-auto my-2 text-foreground border">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        } as Components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;