import { Loader2 } from "lucide-react";

const FullPageSpinner = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default FullPageSpinner;