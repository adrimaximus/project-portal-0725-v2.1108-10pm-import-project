import { useParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { useNavItem } from "@/hooks/useNavItem";
import { Skeleton } from "@/components/ui/skeleton";
import EmbedRenderer from "@/components/EmbedRenderer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const EmbedPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: navItem, isLoading, error } = useNavItem(slug);

  if (isLoading) {
    return (
      <PortalLayout noPadding>
        <div className="h-screen w-full flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      </PortalLayout>
    );
  }

  if (error || !navItem) {
    return (
      <PortalLayout>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load embedded content. Please check the configuration.
          </AlertDescription>
        </Alert>
      </PortalLayout>
    );
  }

  const finalContent = navItem.url;

  return (
    <PortalLayout noPadding>
      <EmbedRenderer content={finalContent} />
    </PortalLayout>
  );
};

export default EmbedPage;