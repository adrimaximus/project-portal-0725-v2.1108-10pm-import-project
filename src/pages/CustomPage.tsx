import { useParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { useNavItem } from "@/hooks/useNavItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const CustomPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: navItem, isLoading, error } = useNavItem(slug);

  if (isLoading) {
    return (
      <PortalLayout noPadding>
        <div className="p-4">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <Skeleton className="h-64 w-full" />
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
            Could not load page content. Please try again later.
          </AlertDescription>
        </Alert>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout noPadding>
      <div className="flex flex-col h-full bg-background">
        <header className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <h1 className="text-2xl font-bold">{navItem.name}</h1>
        </header>
        <div className="flex-1 p-4">
          <p>This is a custom page for "{navItem.name}".</p>
          <p>URL: {navItem.url}</p>
        </div>
      </div>
    </PortalLayout>
  );
};

export default CustomPage;