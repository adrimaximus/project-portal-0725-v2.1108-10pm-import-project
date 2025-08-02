import { useSearchParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const EmbedPage = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'Custom Page';

  if (!url) {
    return (
      <PortalLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No URL was provided to embed.</AlertDescription>
        </Alert>
      </PortalLayout>
    );
  }

  let finalUrl = decodeURIComponent(url);
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