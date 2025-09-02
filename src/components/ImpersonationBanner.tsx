import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

const ImpersonationBanner = () => {
  const { isImpersonating, user, stopImpersonation } = useAuth();

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-yellow-400/20 border-t-2 border-yellow-500 text-yellow-800 dark:text-yellow-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-semibold">
            Anda sedang melihat sebagai <span className="font-bold">{user?.name || 'pengguna'}</span>.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopImpersonation}
          className="text-yellow-800 dark:text-yellow-300 hover:bg-yellow-400/30 hover:text-yellow-900 dark:hover:text-yellow-200"
        >
          Kembali ke Akun Admin
        </Button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;