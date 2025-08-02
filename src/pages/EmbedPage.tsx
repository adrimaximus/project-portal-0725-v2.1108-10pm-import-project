import { useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { AlertTriangle } from "lucide-react";

const EmbedPage = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const title = searchParams.get("title");

  if (!url) {
    return (
      <PortalLayout>
        <div className="flex h-full w-full items-center justify-center bg-muted/40">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-2xl font-bold">Embedding Error</h1>
            <p className="mt-2 text-muted-foreground">
              No URL was provided to embed.
            </p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="flex h-full w-full flex-col">
        {title && (
          <header className="flex h-14 shrink-0 items-center border-b bg-background px-4 md:px-6">
            <h1 className="text-lg font-semibold">{title}</h1>
          </header>
        )}
        <div className="flex-1">
          <iframe
            src={url}
            title={title || "Embedded Content"}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </PortalLayout>
  );
};

export default EmbedPage;