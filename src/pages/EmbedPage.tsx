import { useTheme } from "@/contexts/ThemeProvider";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

const EmbedPage = () => {
    const { slug, itemSlug } = useParams();
    const { mode } = useTheme();

    const embedUrl = `https://example.com/embed/${slug}/${itemSlug}`;

    useEffect(() => {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const effectiveMode = mode === "system" ? systemTheme : mode;
      const bgColor = effectiveMode === 'dark' ? '#222222' : '#FFFFFF';
      
      document.body.style.backgroundColor = bgColor;
      return () => {
        document.body.style.backgroundColor = '';
      }
    }, [mode]);

    return (
        <div className="h-full w-full">
            <iframe title="embed" src={embedUrl} className="h-full w-full border-0" />
        </div>
    )
}

export default EmbedPage;