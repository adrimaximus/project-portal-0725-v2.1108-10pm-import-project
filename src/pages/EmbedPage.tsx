import { useSearchParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const EmbedPage = () => {
  const [searchParams] = useSearchParams();
  const content = searchParams.get('url');
  const title = searchParams.get('title') || 'Custom Page';

  if (!content) {
    return (
      <PortalLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No URL or embed code was provided.</AlertDescription>
        </Alert>
      </PortalLayout>
    );
  }

  const decodedContent = decodeURIComponent(content);
  const isIframe = decodedContent.trim().startsWith('<iframe');

  if (isIframe) {
    const sanitizedContent = decodedContent
      .replace(/width="[^"]*"/g, 'width="100%"')
      .replace(/height="[^"]*"/g, 'height="100%"');
    
    return (
      <PortalLayout noPadding disableMainScroll>
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{
            __html: sanitizedContent,
          }}
        />
      </PortalLayout>
    );
  }

  let finalUrl = decodedContent;
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = `https://${finalUrl}`;
  }

  return (
    <PortalLayout noPadding disableMainScroll>
      <iframe
        src={finalUrl}
        className="w-full h-full border-0"
        title={title}
        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
      />
    </PortalLayout>
  );
};

export default EmbedPage;