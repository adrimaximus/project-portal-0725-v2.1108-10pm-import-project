import React from 'react';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';

interface EmbedRendererProps {
  content: string;
}

const EmbedRenderer: React.FC<EmbedRendererProps> = ({ content }) => {
  const isIframe = content.trim().startsWith('<iframe');
  
  let srcUrl = content;
  if (isIframe) {
    const match = content.match(/src="([^"]+)"/);
    if (match) {
      srcUrl = match[1];
    }
  }

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
    let processedIframe = content;
    if (processedIframe.includes('class="')) {
        processedIframe = processedIframe.replace('class="', 'class="w-full h-full border-0 relative bg-background ');
    } else {
        processedIframe = processedIframe.replace('<iframe', '<iframe class="w-full h-full border-0 relative bg-background"');
    }

    return (
      <div className="relative w-full h-full">
        <Fallback />
        <div
          className="w-full h-full"
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