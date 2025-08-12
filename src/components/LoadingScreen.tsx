import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background animate-fade-in">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-lg text-muted-foreground">Preparing your workspace...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;