import { useSearchParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { useMemo } from 'react';
import EmbedRenderer from '@/components/EmbedRenderer';

const EmbedPage = () => {
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const content = searchParams.get('url');

  const finalContent = useMemo(() => {
    if (!content) return null;

    const decodedContent = decodeURIComponent(content);

    const isIframe = decodedContent.trim().startsWith('<iframe');
    const isGoogleCalendar = decodedContent.includes('calendar.google.com/calendar/embed');

    if (isGoogleCalendar) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const effectiveTheme = theme === "system" ? systemTheme : theme;
      const bgColor = effectiveTheme === 'dark' ? '#222222' : '#FFFFFF';
      const encodedBgColor = encodeURIComponent(bgColor);

      if (isIframe) {
        return decodedContent
          .replace(/src="([^"]+)"/, (match, srcUrl) => {
            let newSrcUrl = srcUrl.replace(/&?bgcolor=([^&]*)/, '');
            newSrcUrl += `&bgcolor=${encodedBgColor}`;
            return `src="${newSrcUrl}"`;
          })
          .replace(/width="[^"]*"/g, 'width="100%"')
          .replace(/height="[^"]*"/g, 'height="100%"');
      } else {
        let urlString = decodedContent;
        if (!/^https?:\/\//i.test(urlString)) {
          urlString = `https://${urlString}`;
        }
        urlString = urlString.replace(/&?bgcolor=([^&]*)/, '');
        urlString += `&bgcolor=${encodedBgColor}`;
        return urlString;
      }
    }

    if (isIframe) {
      return decodedContent
        .replace(/width="[^"]*"/g, 'width="100%"')
        .replace(/height="[^"]*"/g, 'height="100%"');
    }

    let urlString = decodedContent;
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = `https://${urlString}`;
    }
    return urlString;

  }, [content, theme]);

  if (!finalContent) {
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

  return (
    <PortalLayout noPadding>
      <EmbedRenderer content={finalContent} />
    </PortalLayout>
  );
};

export default EmbedPage;