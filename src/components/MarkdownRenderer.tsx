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
          p: ({node, children, ...props}) => (
            <p 
              {...props} 
              className="mb-4 last:mb-0 text-sm leading-7 text-foreground/90 whitespace-pre-wrap break-words"
            >
              {children}
            </p>
          ),
          
          // Enhanced list styling
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-4 space-y-2 text-sm text-foreground/90" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-2 text-sm text-foreground/90" {...props} />,
          li: ({node, ...props}) => <li className="pl-1 leading-7" {...props} />,
          
          // Enhanced headings
          h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-4 mt-6 text-foreground tracking-tight" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-3 mt-5 text-foreground tracking-tight" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-3 mt-4 text-foreground" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-sm font-semibold mb-2 mt-4 text-foreground" {...props} />,
          
          // Custom link handling for mentions and tasks
          a: ({node, href, children, ...props}) => {
            if (!href) return <a {...props}>{children}</a>;

            // Handle Mentions
            if (href.startsWith('mention:')) {
              // const id = href.replace('mention:', '');
              return (
                <span className="font-semibold text-primary hover:underline cursor-pointer">
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
                    <Link to={url} className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors">
                      {children}
                    </Link>
                  );
              }
            }

            // Internal Links
            if (href.startsWith('/')) {
              return (
                <Link to={href} className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors">
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
                className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          
          // Enhanced blockquote
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 bg-muted/40 pl-4 py-3 italic my-4 text-muted-foreground rounded-r-lg text-sm leading-relaxed" {...props} />,
          
          // Enhanced table support
          table: ({node, ...props}) => <div className="overflow-x-auto my-6 rounded-lg border shadow-sm"><table className="w-full text-sm text-left" {...props} /></div>,
          thead: ({node, ...props}) => <thead className="bg-muted/50 text-muted-foreground font-semibold" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-muted/30 transition-colors" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 text-xs uppercase tracking-wider" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 border-t" {...props} />,

          // Enhanced image styling
          img: ({node, ...props}) => <img className="max-w-full h-auto rounded-lg my-4 border shadow-sm max-h-[500px] object-contain bg-background/50" {...props} />,

          // Enhanced divider
          hr: ({node, ...props}) => <hr className="my-6 border-border" {...props} />,

          // Code blocks
          code: ({node, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground font-medium border border-border/50" {...props}>
                {children}
              </code>
            ) : (
              <div className="relative group my-4">
                <pre className="block bg-muted/50 p-4 rounded-lg text-xs font-mono overflow-x-auto text-foreground border shadow-sm">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
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