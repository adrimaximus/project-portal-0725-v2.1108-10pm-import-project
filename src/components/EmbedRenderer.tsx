import React, { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';

interface EmbedRendererProps {
  content: string;
}

const EmbedRenderer: React.FC<EmbedRendererProps> = ({ content }) => {
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const isIframe = content.trim().startsWith('<iframe');
  
  let srcUrl = content;
  if (isIframe) {
    const srcMatch = content.match(/src="([^"]+)"/);
    const dataSrcMatch = content.match(/data-tally-src="([^"]+)"/);
    if (srcMatch) {
      srcUrl = srcMatch[1];
    } else if (dataSrcMatch) {
      srcUrl = dataSrcMatch[1];
    }
  }

  useEffect(() => {
    if (isIframe && embedContainerRef.current) {
      const container = embedContainerRef.current;
      const scripts = Array.from(container.getElementsByTagName('script'));
      const loadedScripts: HTMLScriptElement[] = [];

      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        if (oldScript.innerHTML) {
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        }
        
        document.body.appendChild(newScript);
        loadedScripts.push(newScript);
        oldScript.remove();
      });

      return () => {
        loadedScripts.forEach(script => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        });
      };
    }
  }, [content, isIframe]);

  const Fallback = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-center p-4 z-0">
      <p className="text-sm text-muted-foreground">
        Jika konten tidak dapat dimuat, mungkin tidak mendukung penyematan.
      </p>
      <Button asChild variant="secondary" className="mt-4">
        <a href={srcUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Buka di Tab Baru
        </a>
      </Button>
    </div>
  );

  if (isIframe) {
    // Remove fixed height/width to allow CSS or the script to take over
    let processedIframe = content.replace(/ (height|width)="[^"]*"/g, '');

    return (
      <div className="relative w-full">
        <Fallback />
        <div
          ref={embedContainerRef}
          className="w-full [&>iframe]:w-full"
          dangerouslySetInnerHTML={{ __html: processedIframe }}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Fallback />
      <iframe
        src={content}
        className="w-full h-full border-0 relative bg-background"
        allowFullScreen
        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
      />
    </div>
  );
};

export default EmbedRenderer;