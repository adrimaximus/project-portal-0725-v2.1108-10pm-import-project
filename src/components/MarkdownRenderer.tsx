import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className }) => {
  // Pre-process mentions: @[Name](id) -> [@Name](mention:id)
  const processedContent = children.replace(/@\[(.*?)\]\((.*?)\)/g, '[@$1](mention:$2)');

  return (
    <div className={cn("markdown-content text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3 border-b pb-1" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-base font-bold mt-3 mb-1" {...props} />,
          h5: ({node, ...props}) => <h5 className="text-sm font-bold mt-2 mb-1 uppercase text-muted-foreground" {...props} />,
          h6: ({node, ...props}) => <h6 className="text-xs font-bold mt-2 mb-1 text-muted-foreground" {...props} />,
          
          a: ({ node, href, children, ...props }) => {
            if (href?.startsWith('mention:')) {
              return (
                <span className="font-semibold text-primary hover:underline cursor-pointer bg-primary/10 rounded-sm px-1">
                  {children}
                </span>
              );
            }
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary font-medium hover:underline break-all" 
                {...props}
              >
                {children}
              </a>
            );
          },
          
          // Removed text-sm so it inherits from parent (e.g. text-xs in reply blocks)
          p: ({node, children, ...props}) => <p {...props} className="mb-2 last:mb-0">{children}</p>,
          
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 py-1 my-3 bg-muted/30 italic rounded-r-sm text-muted-foreground" {...props} />
          ),
          
          code: ({node, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isMultiLine = String(children).includes('\n');
            
            if (!isMultiLine && !match) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-[0.9em] font-mono text-foreground border border-border" {...props}>
                  {children}
                </code>
              );
            }
            
            return (
               <div className="relative my-3 rounded-lg overflow-hidden border border-border bg-zinc-950 dark:bg-zinc-900">
                 <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
                   <span className="text-xs text-zinc-400">{match ? match[1] : 'code'}</span>
                 </div>
                 <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-50 leading-normal">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          
          pre: ({node, ...props}) => <div {...(props as any)} />, 
          
          img: ({node, ...props}) => (
            <img 
              className="max-w-full h-auto rounded-lg my-3 border shadow-sm" 
              loading="lazy" 
              {...props} 
              alt={props.alt || 'Image'} 
            />
          ),
          
          hr: ({node, ...props}) => <hr className="my-6 border-t border-border" {...props} />,
          
          table: ({node, ...props}) => (
            <div className="my-4 w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-muted/50" {...props} />,
          tbody: ({node, ...props}) => <tbody className="bg-background" {...props} />,
          tr: ({node, ...props}) => <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 text-left font-semibold text-muted-foreground align-middle" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 align-middle" {...props} />,
          
          input: ({node, ...props}) => {
            if (props.type === 'checkbox') {
               return (
                 <span className="inline-flex items-center justify-center w-5 h-5 mr-2 align-text-bottom">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-primary text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 accent-primary" 
                      disabled={true} 
                      checked={props.checked} 
                      {...props} 
                    />
                 </span>
               )
            }
            return <input {...props} />
          },
          
          del: ({node, ...props}) => <del className="text-muted-foreground" {...props} />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;