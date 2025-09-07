import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const CustomPage = () => {
  const [searchParams] = useSearchParams();
  const content = searchParams.get('url');
  const title = searchParams.get('title');

  const isIframe = content && content.trim().startsWith('<iframe');

  useEffect(() => {
    if (content && !isIframe) {
      try {
        // Redirect to external URL
        window.location.href = content;
      } catch (error) {
        console.error("Invalid URL for redirection:", content);
      }
    }
  }, [content, isIframe]);

  if (isIframe) {
    // Make common iframe attributes responsive
    const sanitizedContent = content?.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"');

    return (
      <PortalLayout>
        <div className="space-y-6 h-full">
          {title && <div><h1 className="text-2xl font-bold tracking-tight">{title}</h1></div>}
          <Card className="w-full h-[calc(100vh-150px)] overflow-hidden">
            <CardContent className="p-0 h-full">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{
                  __html: sanitizedContent || '',
                }}
              />
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  if (content) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <p>Redirecting...</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
        <div className="space-y-6">
            {title && <div><h1 className="text-2xl font-bold tracking-tight">{title}</h1></div>}
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Content Not Found</AlertTitle>
                <AlertDescription>
                    The URL or embed code is missing. Please check the navigation settings.
                </AlertDescription>
            </Alert>
        </div>
    </PortalLayout>
  );
};

export default CustomPage;