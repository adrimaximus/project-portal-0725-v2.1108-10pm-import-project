import { useSearchParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { useMemo } from 'react';

const EmbedPage = () => {
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const content = searchParams.get('url');
  const title = searchParams.get('title') || 'Custom Page';

  const finalUrl = useMemo(() => {
    if (!content) return null;

    const decodedContent = decodeURIComponent(content);
    if (decodedContent.trim().startsWith('<iframe')) {
      return null; // Akan ditangani oleh dangerouslySetInnerHTML
    }

    let urlString = decodedContent;
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = `https://${urlString}`;
    }

    // Khusus untuk Google Kalender, sesuaikan tema
    if (urlString.includes('calendar.google.com/calendar/embed')) {
      try {
        const url = new URL(urlString);
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const effectiveTheme = theme === "system" ? systemTheme : theme;
        
        const bgColor = effectiveTheme === 'dark' ? '#222222' : '#FFFFFF';
        url.searchParams.set('bgcolor', encodeURIComponent(bgColor));
        
        return url.toString();
      } catch (e) {
        console.error("URL tidak valid untuk penyesuaian tema:", urlString);
        return urlString; // Kembali ke URL asli jika terjadi kesalahan
      }
    }

    return urlString;
  }, [content, theme]);

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

  return (
    <PortalLayout noPadding disableMainScroll>
      <iframe
        src={finalUrl || ''}
        className="w-full h-full border-0"
        title={title}
        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
      />
    </PortalLayout>
  );
};

export default EmbedPage;